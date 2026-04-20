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
    const updated = await db.query(`
      UPDATE "User"
      SET
        "mustChangePassword" = true,
        "updatedAt" = NOW()
      WHERE role = 'CLIENT'
        AND password IS NOT NULL
        AND "lastLoginAt" IS NULL
        AND "mustChangePassword" = false
      RETURNING id, "clientId", name
    `);

    console.log(
      JSON.stringify(
        {
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
