import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcryptjs from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PDF_PATH = path.resolve(
  __dirname,
  "..",
  "MarvelStudios 2026.pdf"
);
const REPORT_PATH = path.resolve(
  __dirname,
  "..",
  "tmp-pdf-import-report.csv"
);

const DATE_RE = /^\d{1,2}-\d{1,2}-\d{4}$/;
const HEADER_SKIP = [
  "Total pages",
  "Total chars",
  "--- PAGE BREAK ---",
  "Name",
  "Program Type",
  "Activness",
  "No. Of",
  "Sessions",
  "Remainin",
  "Last Month",
  "Notes",
  "Total Attend",
  "End Date",
  "Start Date",
];

const inputArg = process.argv
  .slice(2)
  .find((value) => !value.startsWith("--"));
const inputPath = inputArg
  ? path.resolve(process.cwd(), inputArg)
  : DEFAULT_PDF_PATH;
const dryRun = process.argv.includes("--dry-run");

if (!existsSync(inputPath)) {
  throw new Error(`Input file not found: ${inputPath}`);
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL.");
}

function createPrisma() {
  const pool = new Pool({
    connectionString,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 30000,
  });

  return {
    pool,
    prisma: new PrismaClient({
      adapter: new PrismaPg(pool),
    }),
  };
}

let { prisma, pool } = createPrisma();

async function reconnect() {
  try {
    await prisma.$disconnect();
  } catch {}
  try {
    await pool.end();
  } catch {}
  const next = createPrisma();
  prisma = next.prisma;
  pool = next.pool;
}

async function withRetry(fn, retries = 3) {
  for (let index = 0; index < retries; index += 1) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isConnectionIssue =
        message.includes("Connection terminated") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("connect ETIMEOUT");

      if (!isConnectionIssue || index === retries - 1) {
        throw error;
      }

      await reconnect();
    }
  }

  throw new Error("Unreachable retry state.");
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");

  if (!digits || digits.length < 7) {
    return null;
  }

  if (digits.startsWith("20") && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `+20${digits.slice(1)}`;
  }

  if (/^1[0125]\d{8}$/.test(digits)) {
    return `+20${digits}`;
  }

  return digits.length >= 7 ? digits : null;
}

function parseDate(value) {
  const match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function isHeaderLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return true;
  }

  if (HEADER_SKIP.some((value) => trimmed.startsWith(value))) {
    return true;
  }

  return /^(Sessions|Remainin|g From|Last|Month|Notes|Total|Attend|End Date|Start Date|No\.|ence)/.test(
    trimmed
  );
}

function parseRow(line) {
  const parts = line
    .split("\t")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const fullName = parts[0];
  const groupName = parts[1];

  if (!fullName || !groupName || /^\d/.test(fullName) || /^\d/.test(groupName)) {
    return null;
  }

  let statusIndex = -1;
  for (let index = 2; index < Math.min(parts.length, 5); index += 1) {
    if (parts[index] === "Active" || parts[index] === "InActive") {
      statusIndex = index;
      break;
    }
  }

  if (statusIndex === -1) {
    return null;
  }

  let phone = null;
  if (statusIndex === 3 && /^\d{7,15}$/.test(parts[2])) {
    phone = normalizePhone(parts[2]);
  }

  const isActive = parts[statusIndex] === "Active";
  const trailingParts = parts.slice(statusIndex + 1);

  const dates = [];
  for (const part of trailingParts) {
    if (DATE_RE.test(part)) {
      const parsed = parseDate(part);
      if (parsed) {
        dates.push(parsed);
      }
    }
  }

  return {
    fullName,
    groupName,
    phone,
    isActive,
    endDate: dates.length > 0 ? dates[dates.length - 1] : null,
  };
}

async function extractPdfText() {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({
    data: new Uint8Array(readFileSync(inputPath)),
    verbosity: -1,
  });

  try {
    const rawText = await parser.getText();
    return rawText.pages.map((page) => page.text).join("\n\n--- PAGE BREAK ---\n\n");
  } finally {
    await parser.destroy();
  }
}

function readRowsFromCsv() {
  const content = readFileSync(inputPath, "utf8");
  const [headerLine, ...dataLines] = content.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((value) => value.trim());
  const fullNameIndex = headers.indexOf("fullName");
  const groupNameIndex = headers.indexOf("groupName");
  const phoneIndex = headers.indexOf("phone");

  if (fullNameIndex < 0 || groupNameIndex < 0 || phoneIndex < 0) {
    throw new Error("CSV must contain fullName, groupName, and phone columns.");
  }

  return dataLines
    .map((line) => {
      const parts = line
        .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
        .map((part) => part.trim().replace(/^\"|\"$/g, "").replace(/\"\"/g, '"'));

      const fullName = parts[fullNameIndex] ?? "";
      const groupName = parts[groupNameIndex] ?? "";
      const rawPhone = parts[phoneIndex] ?? "";
      const phone = rawPhone ? normalizePhone(rawPhone) ?? rawPhone : null;

      if (!fullName || !groupName) {
        return null;
      }

      return {
        fullName,
        groupName,
        phone,
        isActive: false,
        endDate: null,
      };
    })
    .filter(Boolean);
}

async function buildClientIdGenerator() {
  const now = new Date();
  const prefix = `${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const [latest, allIds] = await Promise.all([
    withRetry(() =>
      prisma.user.findFirst({
        where: { clientId: { startsWith: prefix } },
        orderBy: { clientId: "desc" },
        select: { clientId: true },
      })
    ),
    withRetry(() =>
      prisma.user.findMany({
        where: { clientId: { not: null } },
        select: { clientId: true },
      })
    ),
  ]);

  let counter = latest?.clientId
    ? Number.parseInt(latest.clientId.slice(4), 10) + 1
    : 1;
  const used = new Set(allIds.map((entry) => entry.clientId).filter(Boolean));

  return () => {
    while (true) {
      const clientId = `${prefix}${String(counter).padStart(3, "0")}`;
      counter += 1;

      if (!used.has(clientId)) {
        used.add(clientId);
        return clientId;
      }
    }
  };
}

function csvValue(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function normalizeGroupType(groupName) {
  return /\bpt\b|\/pt|pt\/|rehab pt|ladies pt|football pt|handball pt/i.test(
    groupName
  )
    ? "PRIVATE"
    : "GROUP";
}

function uniqueRows(rows) {
  const latestByKey = new Map();

  for (const row of rows) {
    const key = row.phone
      ? row.phone
      : `${row.fullName.toLowerCase()}__${row.groupName.toLowerCase()}`;
    const existing = latestByKey.get(key);

    if (!existing) {
      latestByKey.set(key, row);
      continue;
    }

    if (!existing.isActive && row.isActive) {
      latestByKey.set(key, row);
      continue;
    }

    if (existing.isActive && !row.isActive) {
      continue;
    }

    const existingTime = existing.endDate?.getTime() ?? 0;
    const rowTime = row.endDate?.getTime() ?? 0;

    if (rowTime >= existingTime) {
      latestByKey.set(key, row);
    }
  }

  return [...latestByKey.values()];
}

async function ensureCoach() {
  const placeholderCoach = await withRetry(() =>
    prisma.coach.findFirst({
      where: {
        fullName: "Head Coach",
      },
      select: { id: true },
    })
  );

  if (placeholderCoach) {
    return placeholderCoach.id;
  }

  if (dryRun) {
    return "dry-run-coach";
  }

  const coachUser = await withRetry(() =>
    prisma.user.create({
      data: {
        name: "Head Coach",
        role: "COACH",
      },
      select: { id: true },
    })
  );

  const coach = await withRetry(() =>
    prisma.coach.create({
      data: {
        fullName: "Head Coach",
        specialization: "STRENGTH",
        userId: coachUser.id,
      },
      select: { id: true },
    })
  );

  return coach.id;
}

async function main() {
  const parsedRows = inputPath.toLowerCase().endsWith(".csv")
    ? readRowsFromCsv()
    : (() => {
        console.log("Reading PDF...");
        return null;
      })();

  const resolvedRows = parsedRows ?? (
    await extractPdfText()
  )
    .split("\n")
    .filter((line) => !isHeaderLine(line))
    .map(parseRow)
    .filter(Boolean);

  const rows = uniqueRows(resolvedRows).filter(
    (row) => row.phone || row.fullName
  );

  const missingPhoneRows = rows.filter((row) => !row.phone).length;
  const uniqueGroupNames = [...new Set(rows.map((row) => row.groupName))].sort();
  const coachId = await ensureCoach();
  const nextClientId = await buildClientIdGenerator();

  const report = [];
  const stats = {
    parsedRows: resolvedRows.length,
    uniqueClients: rows.length,
    missingPhones: missingPhoneRows,
    groupsCreated: 0,
    clientsCreated: 0,
    clientsUpdated: 0,
    skipped: 0,
    errors: 0,
  };

  const existingGroups = dryRun
    ? []
    : await withRetry(() =>
        prisma.group.findMany({
          select: { id: true, name: true },
        })
      );
  const groupMap = new Map(
    existingGroups.map((group) => [group.name.toLowerCase(), group])
  );

  for (const groupName of uniqueGroupNames) {
    const existing = groupMap.get(groupName.toLowerCase());

    if (existing) {
      continue;
    }

    if (dryRun) {
      groupMap.set(groupName.toLowerCase(), {
        id: `dry-${groupName}`,
        name: groupName,
      });
      stats.groupsCreated += 1;
      continue;
    }

    const created = await withRetry(() =>
      prisma.group.create({
        data: {
          name: groupName,
          type: normalizeGroupType(groupName),
          coachId,
        },
        select: { id: true, name: true },
      })
    );

    groupMap.set(groupName.toLowerCase(), created);
    stats.groupsCreated += 1;
  }

  for (const [index, row] of rows.entries()) {
    if (index > 0 && index % 100 === 0) {
      process.stdout.write(`\rImporting ${index}/${rows.length}...`);
    }

    try {
      const group = groupMap.get(row.groupName.toLowerCase());

      if (!group) {
        throw new Error(`Group not found for ${row.groupName}`);
      }

      let existingClient = null;

      if (!dryRun) {
        existingClient = row.phone
          ? await withRetry(() =>
              prisma.client.findUnique({
                where: { phone: row.phone },
                select: { id: true, userId: true },
              })
            )
          : await withRetry(() =>
              prisma.client.findFirst({
                where: { fullName: row.fullName },
                select: { id: true, userId: true },
              })
            );
      }

      if (existingClient) {
        await withRetry(() =>
          prisma.$transaction([
            prisma.user.update({
              where: { id: existingClient.userId },
              data: {
                name: row.fullName,
              },
            }),
            prisma.client.update({
              where: { id: existingClient.id },
              data: {
                fullName: row.fullName,
                phone: row.phone || null,
                groupId: group.id,
              },
            }),
          ])
        );

        stats.clientsUpdated += 1;
        report.push({
          fullName: row.fullName,
          groupName: row.groupName,
          phone: row.phone ?? "",
          action: "updated",
          clientId: "",
          password: "",
        });
        continue;
      }

      const clientId = nextClientId();
      const password = `MFS_${clientId}`;

      if (!dryRun) {
        const hashedPassword = await bcryptjs.hash(password, 10);

        await withRetry(() =>
          prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                name: row.fullName,
                clientId,
                password: hashedPassword,
                mustChangePassword: true,
                role: "CLIENT",
              },
              select: { id: true },
            });

            await tx.client.create({
              data: {
                fullName: row.fullName,
                phone: row.phone || null,
                groupId: group.id,
                userId: user.id,
              },
            });
          })
        );
      }

      stats.clientsCreated += 1;
      report.push({
        fullName: row.fullName,
        groupName: row.groupName,
        phone: row.phone ?? "",
        action: dryRun ? "would-create" : "created",
        clientId,
        password,
      });
    } catch (error) {
      stats.errors += 1;
      report.push({
        fullName: row.fullName,
        groupName: row.groupName,
        phone: row.phone ?? "",
        action: "error",
        clientId: "",
        password: "",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log();

  const csv = [
    "fullName,groupName,phone,action,clientId,password,error",
    ...report.map((row) =>
      [
        row.fullName,
        row.groupName,
        row.phone,
        row.action,
        row.clientId,
        row.password,
        row.error ?? "",
      ]
        .map(csvValue)
        .join(",")
    ),
  ].join("\n");

  writeFileSync(REPORT_PATH, `${csv}\n`, "utf8");

  console.log(
    JSON.stringify(
      { inputPath, reportPath: REPORT_PATH, dryRun, ...stats },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
    try {
      await pool.end();
    } catch {}
  });
