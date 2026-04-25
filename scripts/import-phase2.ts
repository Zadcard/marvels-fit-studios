/**
 * Phase 2 PDF Import: Coaches, Group types, Schedule blocks, Sessions, Attendance
 *
 * Runs AFTER import-pdf-data.ts (clients already in DB).
 * Idempotent — safe to re-run.
 *
 * Sequence:
 * 1. Re-apply newest (April 2026) client data — fixes sessionsLeft overwritten by older months
 * 2. Create named coaches from program-type keywords
 * 3. Assign coaches to groups; fix group types (PT → PRIVATE)
 * 4. Create one ScheduleBlock per group for April 2026
 * 5. Create one representative TrainingSession per group per month (2026 only)
 * 6. Create SessionBookings (ATTENDED) for active clients with attendance > 0
 *
 * Run: npx tsx scripts/import-phase2.ts
 */

import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_PDF_PATH = resolve(
  __dirname,
  "..",
  "docs",
  "references",
  "MarvelStudios 2026.pdf"
);

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  keepAlive: true,
  idleTimeoutMillis: 60000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ─────────────────────────────────────────────────────────────────────────────
// Coach name extraction from program type
// ─────────────────────────────────────────────────────────────────────────────

interface CoachDef {
  name: string;
  programPatterns: RegExp[];
}

const COACH_DEFS: CoachDef[] = [
  { name: "Youssef",  programPatterns: [/youssef/i, /يوسف/] },
  { name: "Waheed",   programPatterns: [/waheed/i, /wa7ed/i, /وحيد/] },
  { name: "Farouk",   programPatterns: [/farouk/i, /فاروق/] },
  { name: "Zaki",     programPatterns: [/zaki/i, /زكي/] },
  { name: "Hisham",   programPatterns: [/hisham/i, /هشام/] },
  { name: "Ali",      programPatterns: [/^swimming ali$/i, /^youth ali$/i, /\bali\b/i] },
  { name: "Hassan",   programPatterns: [/hassan/i, /حسن/] },
  { name: "Hamooda",  programPatterns: [/hamooda/i, /حمودة/] },
  { name: "Reham",    programPatterns: [/reham/i, /ريهام/] },
  { name: "Yasmeen",  programPatterns: [/yasmeen/i, /ياسمين/] },
  { name: "Shnoda",   programPatterns: [/^shnoda$/i] },
  { name: "Hoda",     programPatterns: [/7eda/i, /7edaa/i, /hoda/i, /هدى/] },
];

function coachForProgram(programType: string): string | null {
  for (const def of COACH_DEFS) {
    for (const pat of def.programPatterns) {
      if (pat.test(programType)) return def.name;
    }
  }
  return null;
}

function isPTProgram(programType: string): boolean {
  return /\bpt\b/i.test(programType) || /^PT/.test(programType) || programType.includes("/PT") || programType.includes("PT/");
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF row parser (same logic as import-pdf-data.ts)
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedRow {
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
  // Month/year of this attendance page
  dataYear: number | null;
  dataMonth: number | null;
}

const DATE_RE = /^\d{1,2}-\d{1,2}-\d{4}$/;

function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1]), mo = parseInt(m[2]), y = parseInt(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2020 || y > 2030) return null;
  return new Date(y, mo - 1, d);
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits.length < 7) return null;
  if (digits.startsWith("20") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+20${digits.slice(1)}`;
  if (/^1[0125]\d{8}$/.test(digits)) return `+20${digits}`;
  return digits.length >= 7 ? digits : null;
}

function parseRow(line: string): ParsedRow | null {
  const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;

  const name = parts[0];
  if (!name || name.length < 2 || /^\d/.test(name)) return null;
  if (name === "Name" || name.startsWith("Sessions") || name.startsWith("Total")) return null;

  const programType = parts[1];
  if (!programType || programType.length < 2 || /^\d/.test(programType)) return null;
  if (programType === "Program Type") return null;

  let activnessIdx = -1;
  for (let i = 2; i < Math.min(parts.length, 5); i++) {
    if (parts[i] === "Active" || parts[i] === "InActive") { activnessIdx = i; break; }
  }
  if (activnessIdx === -1) return null;

  let phone: string | null = null;
  if (activnessIdx === 3 && /^\d{7,15}$/.test(parts[2])) {
    phone = normalizePhone(parts[2]);
  }

  const isActive = parts[activnessIdx] === "Active";
  const afterActive = parts.slice(activnessIdx + 1);

  const preDateNums: number[] = [];
  const dates: Date[] = [];
  const postDateNums: number[] = [];
  const noteFrags: string[] = [];
  let seenDate = false;

  for (const part of afterActive) {
    if (DATE_RE.test(part)) {
      const d = parseDate(part);
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

  const allNums = [...preDateNums, ...postDateNums];
  const totalAttendance = allNums.length > 0 ? Math.max(0, allNums[allNums.length - 1]) : 0;

  let fees = 0, sessionsTotal = 0, sessionsRemaining = 0;
  const feesCandidate = preDateNums.length > 0 ? preDateNums[0] : 0;
  if (feesCandidate > 100) {
    fees = feesCandidate;
    sessionsTotal = preDateNums[1] ?? 0;
    sessionsRemaining = preDateNums[2] ?? sessionsTotal;
  } else {
    sessionsTotal = preDateNums[0] ?? 0;
    sessionsRemaining = preDateNums[1] ?? sessionsTotal;
  }
  sessionsRemaining = Math.max(0, sessionsRemaining);
  sessionsTotal = Math.max(0, sessionsTotal);
  if (sessionsTotal > 0 && sessionsRemaining > sessionsTotal) sessionsRemaining = sessionsTotal;

  const endDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const startDate = dates.length > 1 ? dates[dates.length - 2] : null;

  // Determine the month/year of this attendance page from the end date
  const dataYear = endDate?.getFullYear() ?? null;
  const dataMonth = endDate?.getMonth() != null ? (endDate!.getMonth() + 1) : null;

  return {
    name, programType, phone, isActive, fees,
    sessionsTotal, sessionsRemaining, endDate, startDate,
    notes: noteFrags.join(" ").slice(0, 500),
    totalAttendance, dataYear, dataMonth,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconnect helper
// ─────────────────────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if ((msg.includes("Connection terminated") || msg.includes("ECONNRESET")) && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("unreachable");
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract PDF text
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
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Phase 2 Import: Coaches / Group Types / Schedule / Attendance ===\n");

  // ── Extract PDF ──
  console.log("Extracting PDF text…");
  const pdfText = await extractPdfText();
  const lines = pdfText.split("\n");

  // ── Parse all rows ──
  const SKIP = ["Total pages", "Total chars", "--- PAGE BREAK ---", "Program Type", "Activness", "No. Of", "Sessions\n", "Remainin", "Last Month", "Notes", "Total\nAttend", "End Date", "Start Date"];
  const allRows: ParsedRow[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || SKIP.some((s) => t.startsWith(s))) continue;
    if (/^(Sessions|Remainin|g From|Last|Month|Notes|Total|Attend|End Date|Start Date|No\.|ence)/.test(t)) continue;
    const row = parseRow(line);
    if (row) allRows.push(row);
  }
  console.log(`Parsed ${allRows.length} rows total\n`);

  // ── Build newest-data index per client ──
  // For each unique client (by phone or name+programType), keep only the row
  // with the MOST RECENT end date AND Active status preferred over InActive.
  const newestByPhone = new Map<string, ParsedRow>();
  const newestByName = new Map<string, ParsedRow>();

  for (const row of allRows) {
    const key = row.phone ?? `${row.name}__${row.programType}`;
    const bucket = row.phone ? newestByPhone : newestByName;

    const existing = bucket.get(key);
    if (!existing) { bucket.set(key, row); continue; }

    // Prefer Active over InActive
    const existingIsActive = existing.isActive;
    const rowIsActive = row.isActive;
    if (!existingIsActive && rowIsActive) { bucket.set(key, row); continue; }
    if (existingIsActive && !rowIsActive) continue; // keep existing active row

    // Both same activity state: prefer newer end date
    const existingDate = existing.endDate?.getTime() ?? 0;
    const rowDate = row.endDate?.getTime() ?? 0;
    if (rowDate > existingDate) bucket.set(key, row);
  }

  const newestRows = [...newestByPhone.values(), ...newestByName.values()];
  const programTypes = [...new Set(allRows.map((r) => r.programType))].sort();
  console.log(`Unique clients (deduplicated): ${newestRows.length}`);
  console.log(`Program types: ${programTypes.length}\n`);

  // ─── STEP 1: Find admin user (for createdById) ───
  const adminUser = await withRetry(() =>
    prisma.user.findFirst({ where: { role: "ADMIN" } })
  );
  if (!adminUser) throw new Error("No admin user found. Run the client import first.");

  // ─── STEP 2: Create coaches from program type names ───
  console.log("── Step 2: Creating coaches…");
  const coachByName = new Map<string, string>(); // name → coachId

  // Load existing coaches first
  const existingCoaches = await withRetry(() => prisma.coach.findMany({ include: { user: true } }));
  for (const c of existingCoaches) coachByName.set(c.fullName.toLowerCase(), c.id);

  const coachNames = [...new Set(
    programTypes.map(coachForProgram).filter(Boolean) as string[]
  )];

  for (const coachName of coachNames) {
    if (coachByName.has(coachName.toLowerCase())) continue;

    const coachUser = await withRetry(() =>
      prisma.user.findFirst({ where: { name: coachName, role: "COACH" } })
    );

    let userId = coachUser?.id;
    if (!userId) {
      const created = await withRetry(() =>
        prisma.user.create({ data: { name: coachName, role: "COACH" } })
      );
      userId = created.id;
    }

    // Check if Coach profile exists
    let coach = await withRetry(() => prisma.coach.findUnique({ where: { userId } }));
    if (!coach) {
      coach = await withRetry(() =>
        prisma.coach.create({
          data: { fullName: coachName, userId, specialization: "STRENGTH" },
        })
      );
    }
    coachByName.set(coachName.toLowerCase(), coach.id);
    console.log(`  Created coach: ${coachName}`);
  }

  // Find the placeholder/default coach for unassigned groups
  const defaultCoach = await withRetry(() => prisma.coach.findFirst());
  if (!defaultCoach) throw new Error("No coach found after creation step");

  // ─── STEP 3: Update group coaches and types ───
  console.log("\n── Step 3: Updating group coaches and types…");
  const existingGroups = await withRetry(() => prisma.group.findMany());
  let groupsUpdated = 0;

  for (const group of existingGroups) {
    const coachName = coachForProgram(group.name);
    const coachId = coachName ? (coachByName.get(coachName.toLowerCase()) ?? defaultCoach.id) : defaultCoach.id;
    const type = isPTProgram(group.name) ? "PRIVATE" : "GROUP";

    if (group.coachId !== coachId || group.type !== type) {
      await withRetry(() =>
        prisma.group.update({ where: { id: group.id }, data: { coachId, type } })
      );
      groupsUpdated++;
    }
  }
  console.log(`  Updated ${groupsUpdated} groups`);

  // Refresh group map
  const allGroups = await withRetry(() => prisma.group.findMany());
  const groupByName = new Map<string, typeof allGroups[0]>();
  for (const g of allGroups) groupByName.set(g.name, g);

  // ─── STEP 4: Fix client sessionsLeft with newest data ───
  console.log("\n── Step 4: Fixing client data with newest (most recent) PDF row…");
  let clientsFixed = 0;
  let clientErrors = 0;

  for (const row of newestRows) {
    try {
      const phone = row.phone;
      const client = phone
        ? await withRetry(() => prisma.client.findUnique({ where: { phone } }))
        : await withRetry(() => prisma.client.findFirst({ where: { fullName: row.name } }));

      if (!client) continue; // not in DB, skip

      const group = groupByName.get(row.programType);
      const paymentStatus = row.isActive && (row.fees > 0 || row.sessionsRemaining > 0)
        ? ("PAID" as const)
        : ("UNPAID" as const);
      const lifecycleStatus = row.isActive ? ("ACTIVE" as const) : ("PAUSED" as const);

      await withRetry(() =>
        prisma.client.update({
          where: { id: client!.id },
          data: {
            sessionsLeft: row.sessionsRemaining,
            isPaid: paymentStatus === "PAID",
            paymentStatus,
            status: lifecycleStatus,
            groupId: group?.id ?? client!.groupId,
            fullName: row.name, // normalize name
          },
        })
      );
      clientsFixed++;
    } catch {
      clientErrors++;
    }
  }
  console.log(`  Fixed ${clientsFixed} clients (${clientErrors} errors)`);

  // ─── STEP 5: Create ScheduleBlock per group ───
  console.log("\n── Step 5: Creating schedule blocks…");

  // We only create blocks for groups that have active clients in April 2026
  const apr2026Rows = allRows.filter(
    (r) => r.isActive && r.dataYear === 2026 && r.dataMonth != null && r.dataMonth >= 4
  );
  const activeGroupNames = [...new Set(apr2026Rows.map((r) => r.programType))];

  const schedBlockStart = new Date(2026, 3, 1); // April 1, 2026
  const schedBlockEnd = new Date(2026, 3, 30);  // April 30, 2026

  let blocksCreated = 0;
  const blockByGroupId = new Map<string, string>(); // groupId → scheduleBlockId

  for (const groupName of activeGroupNames) {
    const group = groupByName.get(groupName);
    if (!group) continue;

    const existing = await withRetry(() =>
      prisma.scheduleBlock.findFirst({
        where: { groupId: group.id, startsOn: schedBlockStart },
      })
    );

    if (existing) { blockByGroupId.set(group.id, existing.id); continue; }

    const blockType = isPTProgram(groupName) ? "PRIVATE" : "GROUP";
    const recDays = blockType === "PRIVATE"
      ? (["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const)
      : (["SUNDAY", "TUESDAY", "THURSDAY"] as const);

    const newBlock = await withRetry(() =>
      prisma.scheduleBlock.create({
        data: {
          title: `${groupName} — April 2026`,
          sessionType: blockType,
          status: "ACTIVE",
          recurrenceType: "WEEKLY",
          recurrenceDays: [...recDays],
          startsOn: schedBlockStart,
          endsOn: schedBlockEnd,
          startTime: "08:00",
          endTime: "09:00",
          timezone: "Africa/Cairo",
          coachId: group.coachId,
          groupId: group.id,
          createdById: adminUser.id,
        },
      })
    );
    blockByGroupId.set(group.id, newBlock.id);
    blocksCreated++;
  }
  console.log(`  Created ${blocksCreated} schedule blocks (${activeGroupNames.length} active groups)`);

  // ─── STEP 6: Create one TrainingSession per group for April 2026 ───
  console.log("\n── Step 6: Creating monthly group sessions…");

  const sessionStart = new Date(2026, 3, 1, 8, 0); // April 1, 2026 08:00
  const sessionEnd = new Date(2026, 3, 30, 9, 0);  // April 30, 2026 09:00

  let sessionsCreated = 0;
  const trainingSessionByGroupId = new Map<string, string>(); // groupId → trainingSessionId

  for (const groupName of activeGroupNames) {
    const group = groupByName.get(groupName);
    if (!group) continue;

    const existing = await withRetry(() =>
      prisma.trainingSession.findFirst({
        where: { groupId: group.id, startsAt: sessionStart },
      })
    );

    if (existing) { trainingSessionByGroupId.set(group.id, existing.id); continue; }

    const sessionType = isPTProgram(groupName) ? "PRIVATE" : "GROUP";
    const blockId = blockByGroupId.get(group.id);

    const ts = await withRetry(() =>
      prisma.trainingSession.create({
        data: {
          title: `${groupName} — April 2026`,
          type: sessionType,
          status: "COMPLETED",
          startsAt: sessionStart,
          endsAt: sessionEnd,
          coachId: group.coachId,
          groupId: group.id,
          scheduleBlockId: blockId ?? null,
          createdById: adminUser.id,
        },
      })
    );
    trainingSessionByGroupId.set(group.id, ts.id);
    sessionsCreated++;
  }
  console.log(`  Created ${sessionsCreated} training sessions`);

  // ─── STEP 7: Create SessionBookings for attendance ───
  console.log("\n── Step 7: Creating attendance records…");

  const attendedRows = apr2026Rows.filter((r) => r.totalAttendance > 0);
  let bookingsCreated = 0;
  let bookingErrors = 0;
  let bookingIndex = 0;

  for (const row of attendedRows) {
    bookingIndex++;
    if (bookingIndex % 100 === 0) {
      process.stdout.write(`\r  Attendance: ${bookingIndex}/${attendedRows.length}…`);
    }

    try {
      const phone = row.phone;
      const client = phone
        ? await withRetry(() => prisma.client.findUnique({ where: { phone } }))
        : await withRetry(() => prisma.client.findFirst({ where: { fullName: row.name } }));
      if (!client) continue;

      const group = groupByName.get(row.programType);
      if (!group) continue;

      const trainingSessionId = trainingSessionByGroupId.get(group.id);
      if (!trainingSessionId) continue;

      // Check if booking already exists
      const existing = await withRetry(() =>
        prisma.sessionBooking.findUnique({
          where: { trainingSessionId_clientId: { trainingSessionId, clientId: client.id } },
        })
      );
      if (existing) continue;

      await withRetry(() =>
        prisma.sessionBooking.create({
          data: {
            trainingSessionId,
            clientId: client.id,
            status: "ATTENDED",
            source: "MANUAL",
            attendedAt: sessionEnd,
          },
        })
      );
      bookingsCreated++;
    } catch {
      bookingErrors++;
    }
  }
  console.log(`\n  Created ${bookingsCreated} attendance records (${bookingErrors} errors)`);

  // ─── STEP 8: Add clients to their group's ScheduleBlock roster ───
  console.log("\n── Step 8: Adding clients to schedule block rosters…");
  let rosterAdded = 0;
  let rosterErrors = 0;

  for (const row of apr2026Rows) {
    try {
      const phone = row.phone;
      const client = phone
        ? await withRetry(() => prisma.client.findUnique({ where: { phone } }))
        : await withRetry(() => prisma.client.findFirst({ where: { fullName: row.name } }));
      if (!client) continue;

      const group = groupByName.get(row.programType);
      if (!group) continue;

      const blockId = blockByGroupId.get(group.id);
      if (!blockId) continue;

      const existing = await withRetry(() =>
        prisma.scheduleBlockClient.findUnique({
          where: { scheduleBlockId_clientId: { scheduleBlockId: blockId, clientId: client.id } },
        })
      );
      if (existing) continue;

      await withRetry(() =>
        prisma.scheduleBlockClient.create({
          data: { scheduleBlockId: blockId, clientId: client.id },
        })
      );
      rosterAdded++;
    } catch {
      rosterErrors++;
    }
  }
  console.log(`  Added ${rosterAdded} clients to schedule block rosters (${rosterErrors} errors)`);

  // ─── Final Report ───
  const [clientCount, groupCount, coachCount, blockCount, sessionCount, bookingCount] =
    await Promise.all([
      prisma.client.count(),
      prisma.group.count(),
      prisma.coach.count(),
      prisma.scheduleBlock.count(),
      prisma.trainingSession.count(),
      prisma.sessionBooking.count(),
    ]);

  console.log("\n══════════════════════════════════════");
  console.log("         PHASE 2 COMPLETE");
  console.log("══════════════════════════════════════");
  console.log(`Clients in DB:        ${clientCount}`);
  console.log(`Groups in DB:         ${groupCount}`);
  console.log(`Coaches in DB:        ${coachCount}`);
  console.log(`Schedule blocks:      ${blockCount}`);
  console.log(`Training sessions:    ${sessionCount}`);
  console.log(`Session bookings:     ${bookingCount}`);
  console.log(`\nClients data fixed:   ${clientsFixed}`);
  console.log(`Groups type/coach upd:${groupsUpdated}`);
  console.log(`Blocks created:       ${blocksCreated}`);
  console.log(`Sessions created:     ${sessionsCreated}`);
  console.log(`Attendance records:   ${bookingsCreated}`);
  console.log(`Roster entries added: ${rosterAdded}`);
  console.log("\n✓ Phase 2 complete.\n");
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exit(1); })
  .finally(async () => { try { await pool.end(); } catch { /* ignore */ } });
