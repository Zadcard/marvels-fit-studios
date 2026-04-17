/**
 * PDF Client Data Import Script
 * Reads MarvelStudios 2026.pdf and upserts all client data into the database.
 * Idempotent: safe to re-run. Matches existing clients by normalized phone number.
 *
 * Run: npx tsx scripts/import-pdf-data.ts
 */

import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_PDF_PATH = resolve(
  __dirname,
  "..",
  "docs",
  "references",
  "MarvelStudios 2026.pdf"
);

// Use DIRECT_URL for scripts to avoid pooler connection timeouts
const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;

function makePrisma() {
  const pool = new Pool({
    connectionString: connStr,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 30000,
  });
  const adapter = new PrismaPg(pool);
  return { prisma: new PrismaClient({ adapter }), pool };
}

let { prisma, pool } = makePrisma();

async function reconnect() {
  try { await pool.end(); } catch { /* ignore */ }
  const next = makePrisma();
  prisma = next.prisma;
  pool = next.pool;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isConn = msg.includes("Connection terminated") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT") || msg.includes("connect ETIMEOUT");
      if (isConn && i < retries - 1) {
        console.warn(`  [reconnect] attempt ${i + 1}/${retries}…`);
        await reconnect();
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedClient {
  name: string;
  programType: string;
  phone: string | null;
  isActive: boolean;
  fees: number;
  sessionsTotal: number;
  sessionsRemaining: number;
  endDate: Date | null;
  startDate: Date | null;
  notes: string;
  totalAttendance: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone normalizer (matches lib/validators/id-auth.ts)
// ─────────────────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits.length < 7) return null;
  if (digits.startsWith("20") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+20${digits.slice(1)}`;
  if (/^1[0125]\d{8}$/.test(digits)) return `+20${digits}`;
  return digits.length >= 7 ? digits : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF text parser
// ─────────────────────────────────────────────────────────────────────────────

const DATE_RE = /^\d{1,2}-\d{1,2}-\d{4}$/;
const SKIP_PATTERNS = [
  "Total pages",
  "Total chars",
  "--- PAGE BREAK ---",
  "Name \t",
  "Program Type",
  "Activness",
  "No. Of",
  "Sessions\n",
  "Remainin",
  "Last Month",
  "Notes",
  "Total\nAttend",
  "End Date",
  "Start Date",
];

function parseDateStr(s: string): Date | null {
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1]), mo = parseInt(m[2]), y = parseInt(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

function isHeaderLine(line: string): boolean {
  const t = line.trim();
  if (!t || t === "--- PAGE BREAK ---") return true;
  for (const p of SKIP_PATTERNS) {
    if (t.startsWith(p)) return true;
  }
  // Lines that are just column header fragments
  if (/^(Sessions|Remainin|g From|Last|Month|Notes|Total|Attend|End Date|Start Date|No\.|ence)/.test(t)) return true;
  return false;
}

function parseRow(line: string): ParsedClient | null {
  const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;

  // Name must be a plausible person/entity name
  const name = parts[0];
  if (!name || name.length < 2 || /^\d/.test(name)) return null;
  if (name === "Name" || name.startsWith("Sessions") || name.startsWith("Total")) return null;

  // Program type is always second column
  const programType = parts[1];
  if (!programType || programType.length < 2 || /^\d/.test(programType)) return null;
  if (programType === "Program Type") return null;

  // Find activness column (Active / InActive)
  let activnessIdx = -1;
  for (let i = 2; i < Math.min(parts.length, 5); i++) {
    if (parts[i] === "Active" || parts[i] === "InActive") {
      activnessIdx = i;
      break;
    }
  }
  if (activnessIdx === -1) return null;

  // Phone: if there's a column between programType and activness
  let phone: string | null = null;
  if (activnessIdx === 3 && /^\d{7,15}$/.test(parts[2])) {
    phone = normalizePhone(parts[2]);
  }

  const isActive = parts[activnessIdx] === "Active";
  const afterActive = parts.slice(activnessIdx + 1);

  // Partition into numbers, dates, and notes text
  const preDateNums: number[] = [];
  const dates: Date[] = [];
  const postDateNums: number[] = [];
  const noteFrags: string[] = [];
  let seenDate = false;

  for (const part of afterActive) {
    if (DATE_RE.test(part)) {
      const d = parseDateStr(part);
      if (d) { dates.push(d); seenDate = true; }
      continue;
    }
    if (/^-?\d+(\.\d+)?$/.test(part)) {
      const n = parseFloat(part);
      if (!seenDate) preDateNums.push(n);
      else postDateNums.push(n);
      continue;
    }
    if (part.length > 0) noteFrags.push(part);
  }

  // All numbers (pre-date then post-date)
  const allNums = [...preDateNums, ...postDateNums];

  // The total attendance is the LAST number in the row
  const totalAttendance = allNums.length > 0 ? Math.max(0, allNums[allNums.length - 1]) : 0;

  let fees = 0;
  let sessionsTotal = 0;
  let sessionsRemaining = 0;

  // Heuristic: first pre-date number > 100 → it's fees (monetary EGP amount)
  const feesCandidate = preDateNums.length > 0 ? preDateNums[0] : 0;
  if (feesCandidate > 100) {
    fees = feesCandidate;
    sessionsTotal = preDateNums[1] ?? 0;
    sessionsRemaining = preDateNums[2] ?? sessionsTotal;
  } else {
    // No fees column: first = sessions, second = remaining
    sessionsTotal = preDateNums[0] ?? 0;
    sessionsRemaining = preDateNums[1] ?? sessionsTotal;
  }

  // Cap remaining to total
  if (sessionsTotal > 0 && sessionsRemaining > sessionsTotal) {
    sessionsRemaining = sessionsTotal;
  }
  sessionsRemaining = Math.max(0, sessionsRemaining);
  sessionsTotal = Math.max(0, sessionsTotal);

  // Date interpretation: last date = endDate, second-to-last = startDate
  const endDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const startDate = dates.length > 1 ? dates[dates.length - 2] : null;

  return {
    name,
    programType,
    phone,
    isActive,
    fees,
    sessionsTotal,
    sessionsRemaining,
    endDate,
    startDate,
    notes: noteFrags.join(" ").slice(0, 500),
    totalAttendance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract PDF text (re-uses pdf-parse)
// ─────────────────────────────────────────────────────────────────────────────

async function extractPdfText(): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const inputOverride = process.argv[2] ?? process.env.PDF_INPUT_PATH;
  const pdfPath = inputOverride
    ? resolve(process.cwd(), inputOverride)
    : DEFAULT_PDF_PATH;
  if (!existsSync(pdfPath)) {
    throw new Error(
      `PDF file not found at "${pdfPath}". Pass a path via arg 1 or PDF_INPUT_PATH.`
    );
  }
  const data = readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(data), verbosity: -1 });
  try {
    const rawText = await parser.getText();
    return (rawText.pages as Array<{ text: string }>)
      .map((p) => p.text)
      .join("\n\n--- PAGE BREAK ---\n\n");
  } finally {
    await parser.destroy();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// clientId generator (same format as lib/services/client-id-generator.ts)
// ─────────────────────────────────────────────────────────────────────────────

async function buildIdGenerator() {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${yy}${mm}`;

  const latest = await prisma.user.findFirst({
    where: { clientId: { startsWith: prefix } },
    orderBy: { clientId: "desc" },
    select: { clientId: true },
  });

  let counter = latest?.clientId ? parseInt(latest.clientId.slice(4, 7), 10) + 1 : 1;

  const used = new Set<string>(
    (await prisma.user.findMany({ select: { clientId: true } }))
      .map((u) => u.clientId)
      .filter(Boolean) as string[]
  );

  return function nextId(): string {
    while (true) {
      const id = `${prefix}${String(counter).padStart(3, "0")}`;
      counter++;
      if (!used.has(id)) {
        used.add(id);
        return id;
      }
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Marvel Studios PDF Import ===\n");

  // 1. Extract PDF text
  console.log("Extracting PDF text…");
  const pdfText = await extractPdfText();
  const lines = pdfText.split("\n");
  console.log(`PDF lines: ${lines.length}`);

  // 2. Parse rows
  const allRows: ParsedClient[] = [];
  for (const line of lines) {
    if (isHeaderLine(line)) continue;
    const row = parseRow(line);
    if (row) allRows.push(row);
  }

  const activeRows = allRows.filter((r) => r.isActive);
  const programTypes = [...new Set(allRows.map((r) => r.programType))].sort();

  console.log(`\nRows parsed: ${allRows.length} (${activeRows.length} active)`);
  console.log(`Program types: ${programTypes.join(", ")}\n`);

  // 3. Ensure a default coach exists (groups require coachId)
  let defaultCoach = await prisma.coach.findFirst();
  if (!defaultCoach) {
    console.log("No coach in DB — creating placeholder coach…");
    const coachUser = await prisma.user.create({
      data: { name: "Head Coach", clientId: "2600001", role: "COACH" },
    });
    defaultCoach = await prisma.coach.create({
      data: { fullName: "Head Coach", userId: coachUser.id, specialization: "STRENGTH" },
    });
  }

  // 4. Ensure groups exist for every program type
  const groupMap = new Map<string, string>(); // programType → groupId
  for (const pt of programTypes) {
    let group = await prisma.group.findFirst({ where: { name: pt } });
    if (!group) {
      group = await prisma.group.create({
        data: { name: pt, type: "GROUP", coachId: defaultCoach.id },
      });
      console.log(`  Created group: "${pt}"`);
    }
    groupMap.set(pt, group.id);
  }

  // 5. Ensure subscription plans exist for every program type
  const planMap = new Map<string, string>(); // programType → planId
  for (const pt of programTypes) {
    const slug = pt.toLowerCase().replace(/\s+/g, "-") + "-monthly";
    let plan = await prisma.subscriptionPlan.findUnique({ where: { slug } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: `${pt} Monthly`,
          slug,
          billingCycle: "MONTHLY",
          sessionsIncluded: 12,
          price: 800,
          currency: "EGP",
        },
      });
    }
    planMap.set(pt, plan.id);
  }

  // 6. Build clientId generator
  const nextClientId = await buildIdGenerator();

  // 7. Upsert clients
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    subscriptionsCreated: 0,
    paymentsCreated: 0,
    errors: 0,
    errorDetails: [] as string[],
  };

  const BATCH = 50;
  let rowIndex = 0;

  for (const row of allRows) {
    rowIndex++;
    // Reconnect every BATCH rows to keep the connection fresh
    if (rowIndex % BATCH === 0) {
      await reconnect();
      process.stdout.write(`\r  Progress: ${rowIndex}/${allRows.length} rows…`);
    }

    try {
      const phone = row.phone;
      const lifecycleStatus = row.isActive ? "ACTIVE" : ("PAUSED" as const);
      const paymentStatus =
        row.isActive && (row.fees > 0 || row.sessionsRemaining > 0)
          ? ("PAID" as const)
          : ("UNPAID" as const);
      const groupId = groupMap.get(row.programType) ?? null;

      // Find existing client
      let clientRecord = await withRetry(() =>
        phone
          ? prisma.client.findUnique({ where: { phone } })
          : prisma.client.findFirst({ where: { fullName: row.name } })
      );

      if (clientRecord) {
        await withRetry(() =>
          prisma.client.update({
            where: { id: clientRecord!.id },
            data: {
              fullName: row.name,
              phone: phone ?? clientRecord!.phone,
              status: lifecycleStatus,
              paymentStatus,
              sessionsLeft: row.sessionsRemaining,
              isPaid: paymentStatus === "PAID",
              groupId,
            },
          })
        );
        stats.updated++;
      } else {
        const clientId = nextClientId();
        const defaultPassword = `MFS_${clientId}`;
        const hashed = await bcryptjs.hash(defaultPassword, 10);

        const newUser = await withRetry(() =>
          prisma.user.create({
            data: { name: row.name, clientId, role: "CLIENT", password: hashed },
          })
        );

        clientRecord = await withRetry(() =>
          prisma.client.create({
            data: {
              fullName: row.name,
              phone,
              status: lifecycleStatus,
              paymentStatus,
              sessionsLeft: row.sessionsRemaining,
              isPaid: paymentStatus === "PAID",
              groupId,
              userId: newUser.id,
            },
          })
        );
        stats.created++;
      }

      // Subscription
      const planId = planMap.get(row.programType);
      if (planId && (row.sessionsTotal > 0 || row.isActive)) {
        const now = new Date();
        const startsAt = row.startDate ?? now;
        const endsAt = row.endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const sessionsUsed = Math.max(0, row.sessionsTotal - row.sessionsRemaining);

        const existingSub = await withRetry(() =>
          prisma.clientSubscription.findFirst({
            where: { clientId: clientRecord!.id, planId },
          })
        );

        if (!existingSub) {
          await withRetry(() =>
            prisma.clientSubscription.create({
              data: {
                clientId: clientRecord!.id,
                planId,
                status: row.isActive ? "ACTIVE" : "EXPIRED",
                startsAt,
                endsAt,
                sessionsTotal: row.sessionsTotal || null,
                sessionsUsed,
              },
            })
          );
          stats.subscriptionsCreated++;
        }
      }

      // Payment (only if fees > 0 and no prior payment of same amount)
      if (row.fees > 0) {
        const existingPayment = await withRetry(() =>
          prisma.payment.findFirst({
            where: { clientId: clientRecord!.id, amount: row.fees },
          })
        );
        if (!existingPayment) {
          await withRetry(() =>
            prisma.payment.create({
              data: {
                clientId: clientRecord!.id,
                amount: row.fees,
                currency: "EGP",
                date: row.endDate ?? new Date(),
                note: `PDF import: ${row.programType}${row.notes ? " — " + row.notes : ""}`,
              },
            })
          );
          stats.paymentsCreated++;
        }
      }
    } catch (err) {
      stats.errors++;
      const msg = `${row.name} (${row.programType}): ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`;
      stats.errorDetails.push(msg);
    }
  }
  console.log();

  // ─── Report ───
  console.log("\n══════════════════════════════════════");
  console.log("         IMPORT REPORT");
  console.log("══════════════════════════════════════");
  console.log(`Total rows parsed:         ${allRows.length}`);
  console.log(`  Active clients:          ${activeRows.length}`);
  console.log(`  InActive clients:        ${allRows.length - activeRows.length}`);
  console.log(`Clients created:           ${stats.created}`);
  console.log(`Clients updated:           ${stats.updated}`);
  console.log(`Subscriptions created:     ${stats.subscriptionsCreated}`);
  console.log(`Payments recorded:         ${stats.paymentsCreated}`);
  console.log(`Errors:                    ${stats.errors}`);
  if (stats.errorDetails.length > 0) {
    console.log("\nError details:");
    stats.errorDetails.slice(0, 20).forEach((e) => console.log("  ✗", e));
    if (stats.errorDetails.length > 20) {
      console.log(`  ... and ${stats.errorDetails.length - 20} more`);
    }
  }

  // Per-program breakdown
  console.log("\nPer-program breakdown:");
  for (const pt of programTypes) {
    const rows = allRows.filter((r) => r.programType === pt);
    const active = rows.filter((r) => r.isActive);
    console.log(`  ${pt.padEnd(22)} ${rows.length} total, ${active.length} active`);
  }

  console.log("\n✓ Import complete.\n");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    try { await pool.end(); } catch { /* ignore */ }
  });
