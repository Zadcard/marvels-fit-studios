#!/usr/bin/env node

/**
 * Sync official group schedule from WhatsApp images in repo root:
 * - WhatsApp Image 2026-04-17 at 10.54.52 PM.jpeg (Classes)
 * - WhatsApp Image 2026-04-17 at 10.54.52 PM (1).jpeg (Athletes)
 *
 * Actions:
 * 1) Update active/paused group blocks to official weekday + time windows.
 * 2) Update non-completed/non-canceled linked sessions to the same time window.
 * 3) Delete clearly invalid groups only when they are fully unused.
 *
 * Usage:
 *   node scripts/sync-whatsapp-schedule.cjs          # dry-run
 *   node scripts/sync-whatsapp-schedule.cjs --apply  # apply changes
 */

require("dotenv/config");
const { Client } = require("pg");
const crypto = require("crypto");

const shouldApply = process.argv.includes("--apply");

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function monthRange() {
  const now = new Date();
  const startsOn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endsOn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { startsOn, endsOn };
}

const OFFICIAL_SCHEDULE = [
  {
    key: "strength",
    match: (name) => name === "strength",
    startTime: "19:00",
    endTime: "20:30",
    recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
  },
  {
    key: "burning-youth",
    match: (name) => name === "burning youth",
    startTime: "17:30",
    endTime: "19:00",
    recurrenceDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  },
  {
    key: "burning",
    match: (name) => name === "burning",
    startTime: "19:00",
    endTime: "20:30",
    recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
  },
  {
    key: "ladies-reham",
    match: (name) =>
      name === "ladies" || name === "ladies reham" || name === "ladies c reham",
    startTime: "19:00",
    endTime: "20:30",
    recurrenceDays: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY"],
  },
  {
    key: "speedball-youth",
    match: (name) => name === "speedball youth",
    startTime: "17:30",
    endTime: "19:00",
    recurrenceDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  },
  {
    key: "speedball",
    match: (name) => name === "speedball",
    startTime: "17:00",
    endTime: "18:30",
    recurrenceDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  },
  {
    key: "football",
    match: (name) => name === "football",
    startTime: "17:30",
    endTime: "19:00",
    recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
  },
  {
    key: "skating",
    match: (name) => name === "skating",
    startTime: "16:30",
    endTime: "18:00",
    recurrenceDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  },
  {
    key: "swimming",
    match: (name) => name === "swimming",
    startTime: "17:00",
    endTime: "18:30",
    recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
  },
  {
    key: "aquathlon",
    match: (name) => name === "aquathlon",
    startTime: "16:00",
    endTime: "17:30",
    recurrenceDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  },
];

async function run() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL (or DIRECT_URL) is required.");
  }

  const db = new Client({ connectionString });
  await db.connect();

  const summary = {
    matchedPrograms: 0,
    groupsTouched: 0,
    blocksUpdated: 0,
    blocksCreated: 0,
    sessionsUpdated: 0,
    groupsDeleted: 0,
    groupsSkippedDeletion: 0,
  };

  try {
    if (shouldApply) {
      await db.query("BEGIN");
    }

    const adminRow = await db.query(`
      SELECT id
      FROM "User"
      WHERE role = 'ADMIN'
      ORDER BY "createdAt" ASC
      LIMIT 1
    `);
    const createdById = adminRow.rows[0]?.id;
    if (!createdById) {
      throw new Error("No ADMIN user found.");
    }

    const groupsResult = await db.query(`
      SELECT g.id, g.name, g.type, g."coachId"
      FROM "Group" g
      ORDER BY g.name ASC
    `);

    const blocksResult = await db.query(`
      SELECT
        sb.id,
        sb.title,
        sb."groupId",
        sb.status,
        sb."startTime",
        sb."endTime",
        sb."recurrenceDays",
        sb."sessionType"
      FROM "ScheduleBlock" sb
      WHERE sb.status IN ('ACTIVE', 'PAUSED')
      ORDER BY sb.id ASC
    `);

    const blocksByGroupId = new Map();
    for (const block of blocksResult.rows) {
      if (!block.groupId) continue;
      const existing = blocksByGroupId.get(block.groupId);
      if (existing) {
        existing.push(block);
      } else {
        blocksByGroupId.set(block.groupId, [block]);
      }
    }

    const normalizedGroups = groupsResult.rows.map((group) => ({
      ...group,
      normalizedName: normalizeName(group.name),
    }));

    const officialGroupIds = new Set();
    const updatedBlockIds = new Set();
    const { startsOn, endsOn } = monthRange();

    for (const program of OFFICIAL_SCHEDULE) {
      const matchedGroups = normalizedGroups.filter(
        (group) => group.type === "GROUP" && program.match(group.normalizedName)
      );

      if (matchedGroups.length === 0) {
        continue;
      }

      summary.matchedPrograms += 1;

      for (const group of matchedGroups) {
        officialGroupIds.add(group.id);
        summary.groupsTouched += 1;

        const groupBlocks = blocksByGroupId.get(group.id) ?? [];
        if (groupBlocks.length > 0) {
          for (const block of groupBlocks) {
            summary.blocksUpdated += 1;
            updatedBlockIds.add(block.id);

            if (shouldApply) {
              await db.query(
                `
                  UPDATE "ScheduleBlock"
                  SET
                    "sessionType" = 'GROUP',
                    status = 'ACTIVE',
                    "recurrenceType" = 'WEEKLY',
                    "recurrenceDays" = $2::"ScheduleDay"[],
                    "startTime" = $3,
                    "endTime" = $4,
                    timezone = 'Africa/Cairo',
                    "updatedAt" = NOW()
                  WHERE id = $1
                `,
                [block.id, program.recurrenceDays, program.startTime, program.endTime]
              );
            }
          }
        } else {
          summary.blocksCreated += 1;
          const blockId = crypto.randomUUID();
          updatedBlockIds.add(blockId);

          if (shouldApply) {
            await db.query(
              `
                INSERT INTO "ScheduleBlock" (
                  id,
                  title,
                  "description",
                  "sessionType",
                  status,
                  "recurrenceType",
                  "recurrenceDays",
                  "startsOn",
                  "endsOn",
                  "startTime",
                  "endTime",
                  timezone,
                  capacity,
                  location,
                  "coachId",
                  "groupId",
                  "createdById",
                  "createdAt",
                  "updatedAt"
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  'GROUP',
                  'ACTIVE',
                  'WEEKLY',
                  $4::"ScheduleDay"[],
                  $5,
                  $6,
                  $7,
                  $8,
                  'Africa/Cairo',
                  NULL,
                  'Studio floor',
                  $9,
                  $10,
                  $11,
                  NOW(),
                  NOW()
                )
              `,
              [
                blockId,
                `${group.name} — Official schedule`,
                "Synced from official WhatsApp schedule image",
                program.recurrenceDays,
                startsOn,
                endsOn,
                program.startTime,
                program.endTime,
                group.coachId,
                group.id,
                createdById,
              ]
            );
          }
        }
      }
    }

    if (updatedBlockIds.size > 0) {
      const blockIds = Array.from(updatedBlockIds);
      const updatedSessionsPreview = await db.query(
        `
          SELECT COUNT(*)::int AS count
          FROM "TrainingSession" ts
          JOIN "ScheduleBlock" sb
            ON sb.id = ts."scheduleBlockId"
          WHERE ts."scheduleBlockId" = ANY($1::text[])
            AND ts.status NOT IN ('COMPLETED', 'CANCELED')
            AND sb."startTime" IS NOT NULL
            AND sb."endTime" IS NOT NULL
        `,
        [blockIds]
      );

      summary.sessionsUpdated = Number(updatedSessionsPreview.rows[0].count ?? 0);

      if (shouldApply) {
        await db.query(
          `
            UPDATE "TrainingSession" ts
            SET
              "startsAt" = date_trunc('day', ts."startsAt") + sb."startTime"::time,
              "endsAt" = date_trunc('day', ts."startsAt") + sb."endTime"::time,
              "updatedAt" = NOW()
            FROM "ScheduleBlock" sb
            WHERE ts."scheduleBlockId" = sb.id
              AND ts."scheduleBlockId" = ANY($1::text[])
              AND ts.status NOT IN ('COMPLETED', 'CANCELED')
          `,
          [blockIds]
        );
      }
    }

    const candidates = await db.query(`
      SELECT
        g.id,
        g.name,
        (SELECT COUNT(*)::int FROM "Client" c WHERE c."groupId" = g.id) AS clients_count,
        (SELECT COUNT(*)::int FROM "TrainingSession" ts WHERE ts."groupId" = g.id) AS sessions_count,
        (SELECT COUNT(*)::int FROM "File" f WHERE f."groupId" = g.id) AS files_count,
        (SELECT COUNT(*)::int FROM "ScheduleBlock" sb WHERE sb."groupId" = g.id AND sb.status IN ('ACTIVE', 'PAUSED')) AS active_blocks
      FROM "Group" g
      ORDER BY g.name ASC
    `);

    for (const group of candidates.rows) {
      if (officialGroupIds.has(group.id)) {
        continue;
      }

      const hasReferences =
        Number(group.clients_count) > 0 ||
        Number(group.sessions_count) > 0 ||
        Number(group.files_count) > 0;

      if (hasReferences) {
        summary.groupsSkippedDeletion += 1;
        continue;
      }

      summary.groupsDeleted += 1;

      if (shouldApply) {
        await db.query(
          `
            UPDATE "ScheduleBlock"
            SET
              status = 'ARCHIVED',
              "groupId" = NULL,
              "updatedAt" = NOW()
            WHERE "groupId" = $1
              AND status IN ('ACTIVE', 'PAUSED')
          `,
          [group.id]
        );

        await db.query(`DELETE FROM "Group" WHERE id = $1`, [group.id]);
      }
    }

    if (shouldApply) {
      await db.query("COMMIT");
    }

    console.log(`Mode: ${shouldApply ? "APPLY" : "DRY-RUN"}`);
    console.log(`- Official programs matched: ${summary.matchedPrograms}/${OFFICIAL_SCHEDULE.length}`);
    console.log(`- Groups touched: ${summary.groupsTouched}`);
    console.log(`- Schedule blocks updated: ${summary.blocksUpdated}`);
    console.log(`- Schedule blocks created: ${summary.blocksCreated}`);
    console.log(`- Linked sessions re-timed: ${summary.sessionsUpdated}`);
    console.log(`- Unused invalid groups deleted: ${summary.groupsDeleted}`);
    console.log(`- Groups kept (still referenced): ${summary.groupsSkippedDeletion}`);
  } catch (error) {
    if (shouldApply) {
      await db.query("ROLLBACK");
    }
    throw error;
  } finally {
    await db.end();
  }
}

run().catch((error) => {
  console.error("Schedule sync failed:", error.message);
  process.exit(1);
});
