#!/usr/bin/env node

/**
 * Admin data audit
 *
 * Usage:
 *   node scripts/admin-data-audit.cjs
 *
 * Requires:
 *   DATABASE_URL in environment (.env is auto-loaded by Node + dotenv here)
 */

require("dotenv/config");
const { Client } = require("pg");

async function run() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL (or DIRECT_URL) is required.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const summary = await client.query(`
          SELECT
            COUNT(*)::int AS total_clients,
            COUNT(*) FILTER (WHERE c.status = 'ACTIVE')::int AS active_clients,
            COUNT(*) FILTER (WHERE c.status = 'ACTIVE' AND c."groupId" IS NULL)::int AS active_without_group,
            COUNT(*) FILTER (WHERE c."groupId" IS NULL)::int AS no_group
          FROM "Client" c
        `);
    const userAuth = await client.query(`
          SELECT
            COUNT(*) FILTER (WHERE u.role = 'CLIENT')::int AS client_users,
            COUNT(*) FILTER (WHERE u.role = 'CLIENT' AND (u."clientId" IS NULL OR u."clientId" = ''))::int AS missing_client_id,
            COUNT(*) FILTER (WHERE u.role = 'CLIENT' AND (u.password IS NULL OR u.password = ''))::int AS missing_password,
            COUNT(*) FILTER (WHERE u.role = 'CLIENT' AND u.email IS NOT NULL)::int AS users_with_email
          FROM "User" u
        `);
    const activeNoGroupRows = await client.query(`
          SELECT
            c.id,
            c."fullName",
            c.status
          FROM "Client" c
          WHERE c.status = 'ACTIVE' AND c."groupId" IS NULL
          ORDER BY c."fullName" ASC
          LIMIT 50
        `);
    const privateOverbookedRows = await client.query(`
          SELECT
            ts.id AS training_session_id,
            ts.title,
            ts."startsAt",
            COUNT(sb.id)::int AS active_booking_count
          FROM "TrainingSession" ts
          JOIN "SessionBooking" sb
            ON sb."trainingSessionId" = ts.id
            AND sb.status IN ('BOOKED', 'ATTENDED', 'WAITLIST')
          WHERE ts.type = 'PRIVATE'
            AND ts.status IN ('DRAFT', 'SCHEDULED', 'COMPLETED')
          GROUP BY ts.id, ts.title, ts."startsAt"
          HAVING COUNT(sb.id) > 1
          ORDER BY ts."startsAt" DESC
          LIMIT 50
        `);
    const noBlockCount = await client.query(`
          SELECT COUNT(*)::int AS count
          FROM "Client" c
          LEFT JOIN "ScheduleBlockClient" sbc
            ON sbc."clientId" = c.id
          WHERE sbc.id IS NULL
        `);
    const noBlockRows = await client.query(`
          SELECT
            c.id,
            c."fullName"
          FROM "Client" c
          LEFT JOIN "ScheduleBlockClient" sbc
            ON sbc."clientId" = c.id
          WHERE sbc.id IS NULL
          ORDER BY c."fullName" ASC
          LIMIT 50
        `);

    const s = summary.rows[0];
    const a = userAuth.rows[0];

    console.log("=== Admin Data Audit ===");
    console.log("");
    console.log("Clients:");
    console.log(`- Total: ${s.total_clients}`);
    console.log(`- Active: ${s.active_clients}`);
    console.log(`- Active without group: ${s.active_without_group}`);
    console.log(`- No group (all statuses): ${s.no_group}`);
    console.log("");
    console.log("Client user auth:");
    console.log(`- Client users: ${a.client_users}`);
    console.log(`- Missing clientId: ${a.missing_client_id}`);
    console.log(`- Missing password: ${a.missing_password}`);
    console.log(`- Still has email: ${a.users_with_email}`);
    console.log("");
    console.log(`Private sessions with >1 active booking: ${privateOverbookedRows.rowCount}`);
    console.log(`Clients not assigned to any recurring block: ${noBlockCount.rows[0].count}`);
    console.log("");

    if (activeNoGroupRows.rowCount > 0) {
      console.log("Sample ACTIVE clients without group:");
      for (const row of activeNoGroupRows.rows) {
        console.log(`- ${row.fullName} (${row.id})`);
      }
      console.log("");
    }

    if (privateOverbookedRows.rowCount > 0) {
      console.log("Sample overbooked private sessions:");
      for (const row of privateOverbookedRows.rows) {
        console.log(
          `- ${row.title} (${row.training_session_id}) @ ${row.startsAt.toISOString()} -> ${row.active_booking_count} active bookings`
        );
      }
      console.log("");
    }

    if (noBlockRows.rowCount > 0) {
      console.log("Sample clients without recurring block:");
      for (const row of noBlockRows.rows.slice(0, 20)) {
        console.log(`- ${row.fullName} (${row.id})`);
      }
      console.log("");
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("Audit failed:", error.message);
  process.exit(1);
});
