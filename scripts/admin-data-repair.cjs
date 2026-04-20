#!/usr/bin/env node

/**
 * Admin data repair
 *
 * Fixes:
 * 1) CLIENT users missing clientId
 * 2) Users with missing/weak password hash (ADMIN/COACH/CLIENT)
 * 3) PRIVATE sessions with >1 active booking (reclassify to GROUP)
 * 4) PRIVATE schedule blocks with >1 roster client (reclassify to GROUP)
 * 5) Create missing active blocks for groups that have unassigned clients
 * 6) Assign unassigned clients to matching active/paused group blocks
 *
 * Usage:
 *   node scripts/admin-data-repair.cjs          # dry-run
 *   node scripts/admin-data-repair.cjs --apply  # apply changes
 */

require("dotenv/config");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const shouldApply = process.argv.includes("--apply");

function prefixFromDate(value) {
  const date = value ? new Date(value) : new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yy}${mm}`;
}

function buildClientId(prefix, number) {
  return `${prefix}${String(number).padStart(3, "0")}`;
}

function randomSuffix(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

async function run() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL (or DIRECT_URL) is required.");
  }

  const db = new Client({ connectionString });
  await db.connect();

  const assignedClientIdByUserId = new Map();
  const summary = {
    assignedClientIds: 0,
    patchedPasswords: 0,
    retypedSessions: 0,
    retypedBlocks: 0,
    createdBlocks: 0,
    clearedClientEmails: 0,
    blockAssignmentsInserted: 0,
    clientsStillUnassigned: 0,
  };

  try {
    if (shouldApply) {
      await db.query("BEGIN");
    }

    const existingClientIdsResult = await db.query(`
      SELECT "clientId"
      FROM "User"
      WHERE "clientId" ~ '^[0-9]{7}$'
    `);
    const usedClientIds = new Set(
      existingClientIdsResult.rows.map((row) => row.clientId)
    );
    const maxByPrefix = new Map();

    for (const clientId of usedClientIds) {
      const prefix = clientId.slice(0, 4);
      const counter = Number(clientId.slice(4, 7));
      const current = maxByPrefix.get(prefix) ?? 0;
      if (counter > current) {
        maxByPrefix.set(prefix, counter);
      }
    }

    const usersMissingClientId = await db.query(`
      SELECT id, "createdAt", "fullName"
      FROM (
        SELECT u.id, u."createdAt", c."fullName"
        FROM "User" u
        LEFT JOIN "Client" c ON c."userId" = u.id
        WHERE u.role = 'CLIENT'
          AND (u."clientId" IS NULL OR u."clientId" = '')
      ) missing
      ORDER BY "createdAt" ASC, id ASC
    `);

    for (const user of usersMissingClientId.rows) {
      const prefix = prefixFromDate(user.createdAt);
      let counter = (maxByPrefix.get(prefix) ?? 0) + 1;
      let candidate = buildClientId(prefix, counter);

      while (usedClientIds.has(candidate)) {
        counter += 1;
        candidate = buildClientId(prefix, counter);
      }

      usedClientIds.add(candidate);
      maxByPrefix.set(prefix, counter);
      assignedClientIdByUserId.set(user.id, candidate);
      summary.assignedClientIds += 1;

      if (shouldApply) {
        await db.query(
          `
            UPDATE "User"
            SET "clientId" = $2
            WHERE id = $1
          `,
          [user.id, candidate]
        );
      }
    }

    const weakPasswordUsers = await db.query(`
      SELECT id, role, "clientId"
      FROM "User"
      WHERE role IN ('ADMIN', 'COACH', 'CLIENT')
        AND (
          password IS NULL
          OR length(password) < 20
        )
      ORDER BY role ASC, id ASC
    `);

    for (const user of weakPasswordUsers.rows) {
      const effectiveClientId =
        user.clientId || assignedClientIdByUserId.get(user.id) || null;
      const hasNumericClientId = /^[0-9]{7}$/.test(effectiveClientId ?? "");

      const temporaryPassword = hasNumericClientId
        ? `MFS_${effectiveClientId}`
        : `TMP_${user.role}_${randomSuffix(10)}`;

      const hash = await bcrypt.hash(temporaryPassword, 10);
      summary.patchedPasswords += 1;

      if (shouldApply) {
        await db.query(
          `
            UPDATE "User"
            SET
              password = $2,
              "mustChangePassword" = true
            WHERE id = $1
          `,
          [user.id, hash]
        );
      }
    }

    const overbookedPrivateSessions = await db.query(`
      SELECT
        s.id,
        COUNT(b.id)::int AS active_booking_count
      FROM "TrainingSession" s
      JOIN "SessionBooking" b
        ON b."trainingSessionId" = s.id
        AND b.status IN ('BOOKED', 'ATTENDED', 'WAITLIST')
      WHERE s.type = 'PRIVATE'
        AND s.status <> 'CANCELED'
      GROUP BY s.id
      HAVING COUNT(b.id) > 1
      ORDER BY s.id ASC
    `);

    for (const session of overbookedPrivateSessions.rows) {
      summary.retypedSessions += 1;

      if (shouldApply) {
        await db.query(
          `
            UPDATE "TrainingSession"
            SET
              type = 'GROUP',
              capacity = GREATEST(COALESCE(capacity, 0), $2)
            WHERE id = $1
          `,
          [session.id, session.active_booking_count]
        );
      }
    }

    const privateBlocksWithLargeRosters = await db.query(`
      SELECT
        sb.id,
        COUNT(sbc.id)::int AS roster_count
      FROM "ScheduleBlock" sb
      JOIN "ScheduleBlockClient" sbc
        ON sbc."scheduleBlockId" = sb.id
      WHERE sb."sessionType" = 'PRIVATE'
        AND sb.status <> 'ARCHIVED'
      GROUP BY sb.id
      HAVING COUNT(sbc.id) > 1
      ORDER BY sb.id ASC
    `);

    for (const block of privateBlocksWithLargeRosters.rows) {
      summary.retypedBlocks += 1;

      if (shouldApply) {
        await db.query(
          `
            UPDATE "ScheduleBlock"
            SET
              "sessionType" = 'GROUP',
              capacity = GREATEST(COALESCE(capacity, 0), $2)
            WHERE id = $1
          `,
          [block.id, block.roster_count]
        );
      }
    }

    const groupsNeedingBlocks = await db.query(`
      WITH unassigned AS (
        SELECT c.id, c."groupId"
        FROM "Client" c
        LEFT JOIN "ScheduleBlockClient" sbc
          ON sbc."clientId" = c.id
        WHERE sbc.id IS NULL
          AND c."groupId" IS NOT NULL
      )
      SELECT
        g.id,
        g.name,
        g.type,
        g."coachId",
        COUNT(u.id)::int AS unassigned_clients
      FROM unassigned u
      JOIN "Group" g ON g.id = u."groupId"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "ScheduleBlock" sb
        WHERE sb."groupId" = g.id
          AND sb.status IN ('ACTIVE', 'PAUSED')
      )
      GROUP BY g.id, g.name, g.type, g."coachId"
      ORDER BY g.name ASC
    `);

    if (groupsNeedingBlocks.rowCount > 0) {
      const adminUser = await db.query(`
        SELECT id
        FROM "User"
        WHERE role = 'ADMIN'
        ORDER BY "createdAt" ASC
        LIMIT 1
      `);

      const createdById = adminUser.rows[0]?.id;
      if (!createdById) {
        throw new Error("No admin user found to own created schedule blocks.");
      }

      const { start, end } = getCurrentMonthRange();
      const monthLabel = start.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      for (const group of groupsNeedingBlocks.rows) {
        const desiredSessionType =
          group.type === "PRIVATE" && group.unassigned_clients <= 1
            ? "PRIVATE"
            : "GROUP";
        const recurrenceDaysSql =
          desiredSessionType === "PRIVATE"
            ? `ARRAY['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY']::"ScheduleDay"[]`
            : `ARRAY['SUNDAY','TUESDAY','THURSDAY']::"ScheduleDay"[]`;
        const capacity = desiredSessionType === "PRIVATE" ? 1 : null;

        summary.createdBlocks += 1;

        if (shouldApply) {
          await db.query(
            `
              INSERT INTO "ScheduleBlock" (
                id,
                title,
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
                'ACTIVE',
                'WEEKLY',
                ${recurrenceDaysSql},
                $4,
                $5,
                '08:00',
                '09:00',
                'Africa/Cairo',
                $6,
                'Studio floor',
                $7,
                $8,
                $9,
                NOW(),
                NOW()
              )
            `,
            [
              crypto.randomUUID(),
              `${group.name} - ${monthLabel} Auto`,
              desiredSessionType,
              start,
              end,
              capacity,
              group.coachId,
              group.id,
              createdById,
            ]
          );
        }
      }
    }

    const clientEmails = await db.query(`
      SELECT id
      FROM "User"
      WHERE role = 'CLIENT'
        AND email IS NOT NULL
      ORDER BY id ASC
    `);

    summary.clearedClientEmails = clientEmails.rowCount;

    if (shouldApply && clientEmails.rowCount > 0) {
      await db.query(`
        UPDATE "User"
        SET email = NULL
        WHERE role = 'CLIENT'
          AND email IS NOT NULL
      `);
    }

    const assignableBlockRows = await db.query(`
      WITH unassigned AS (
        SELECT c.id, c."groupId"
        FROM "Client" c
        LEFT JOIN "ScheduleBlockClient" sbc
          ON sbc."clientId" = c.id
        WHERE sbc.id IS NULL
      ),
      ranked AS (
        SELECT
          u.id AS client_id,
          sb.id AS schedule_block_id,
          ROW_NUMBER() OVER (
            PARTITION BY u.id
            ORDER BY
              CASE sb.status
                WHEN 'ACTIVE' THEN 0
                WHEN 'PAUSED' THEN 1
                ELSE 2
              END,
              sb."startsOn" ASC,
              sb.id ASC
          ) AS rn
        FROM unassigned u
        JOIN "ScheduleBlock" sb
          ON sb."groupId" = u."groupId"
        WHERE sb.status IN ('ACTIVE', 'PAUSED')
      )
      SELECT client_id, schedule_block_id
      FROM ranked
      WHERE rn = 1
      ORDER BY client_id ASC
    `);

    summary.blockAssignmentsInserted = assignableBlockRows.rowCount;

    if (shouldApply && assignableBlockRows.rowCount > 0) {
      for (const row of assignableBlockRows.rows) {
        await db.query(
          `
            INSERT INTO "ScheduleBlockClient" ("id", "scheduleBlockId", "clientId", "createdAt")
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT ("scheduleBlockId", "clientId") DO NOTHING
          `,
          [crypto.randomUUID(), row.schedule_block_id, row.client_id]
        );
      }
    }

    const remainingUnassigned = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM "Client" c
      LEFT JOIN "ScheduleBlockClient" sbc
        ON sbc."clientId" = c.id
      WHERE sbc.id IS NULL
    `);
    summary.clientsStillUnassigned = Number(remainingUnassigned.rows[0].count);

    if (shouldApply) {
      await db.query("COMMIT");
    }

    console.log(`Mode: ${shouldApply ? "APPLY" : "DRY-RUN"}`);
    console.log(`- Client IDs assigned: ${summary.assignedClientIds}`);
    console.log(`- Password hashes patched: ${summary.patchedPasswords}`);
    console.log(`- Private sessions retyped to GROUP: ${summary.retypedSessions}`);
    console.log(`- Private blocks retyped to GROUP: ${summary.retypedBlocks}`);
    console.log(`- Missing group blocks created: ${summary.createdBlocks}`);
    console.log(`- Client emails cleared: ${summary.clearedClientEmails}`);
    console.log(`- Block assignments inserted (exact group match): ${summary.blockAssignmentsInserted}`);
    console.log(`- Clients still without recurring block: ${summary.clientsStillUnassigned}`);
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
  console.error("Repair failed:", error.message);
  process.exit(1);
});
