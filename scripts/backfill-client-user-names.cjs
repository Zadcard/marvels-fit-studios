#!/usr/bin/env node

require("dotenv/config");
const { Client } = require("pg");

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required.");
  }

  const db = new Client({ connectionString });
  await db.connect();

  try {
    const before = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM "User" u
      JOIN "Client" c ON c."userId" = u.id
      WHERE u.role = 'CLIENT'
        AND (u.name IS NULL OR btrim(u.name) = '')
        AND c."fullName" IS NOT NULL
        AND btrim(c."fullName") <> ''
    `);

    const updated = await db.query(`
      UPDATE "User" u
      SET
        name = c."fullName",
        "updatedAt" = NOW()
      FROM "Client" c
      WHERE c."userId" = u.id
        AND u.role = 'CLIENT'
        AND (u.name IS NULL OR btrim(u.name) = '')
        AND c."fullName" IS NOT NULL
        AND btrim(c."fullName") <> ''
      RETURNING u.id, u."clientId", u.name
    `);

    console.log(
      JSON.stringify(
        {
          missingBefore: before.rows[0]?.count ?? 0,
          updated: updated.rowCount,
          sample: updated.rows.slice(0, 5),
        },
        null,
        2
      )
    );
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
