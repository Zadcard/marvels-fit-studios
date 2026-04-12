require("dotenv/config");

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

const checks = [
  {
    name: "At least one admin account exists",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "User"
      WHERE "role" = 'ADMIN'
    `,
    failWhen: (count) => count === 0,
  },
  {
    name: "Client users have client profiles",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "User" u
      WHERE u."role" = 'CLIENT'
        AND NOT EXISTS (
          SELECT 1
          FROM "Client" c
          WHERE c."userId" = u."id"
        )
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Coach users have coach profiles",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "User" u
      WHERE u."role" = 'COACH'
        AND NOT EXISTS (
          SELECT 1
          FROM "Coach" c
          WHERE c."userId" = u."id"
        )
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Credential users have password hashes",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "User"
      WHERE "role" IN ('ADMIN', 'COACH', 'CLIENT')
        AND (
          "password" IS NULL
          OR length("password") < 20
        )
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Training sessions have valid time ranges",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "TrainingSession"
      WHERE "endsAt" <= "startsAt"
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Group session capacity is positive when configured",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "TrainingSession"
      WHERE "type" = 'GROUP'
        AND "capacity" IS NOT NULL
        AND "capacity" <= 0
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Canceled sessions do not keep active bookings",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "SessionBooking" b
      INNER JOIN "TrainingSession" s ON s."id" = b."trainingSessionId"
      WHERE s."status" = 'CANCELED'
        AND b."status" IN ('BOOKED', 'ATTENDED', 'WAITLIST')
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Canceled bookings do not keep attendance timestamps",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "SessionBooking"
      WHERE "status" = 'CANCELED'
        AND "attendedAt" IS NOT NULL
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Attended bookings have attendance timestamps",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "SessionBooking"
      WHERE "status" = 'ATTENDED'
        AND "attendedAt" IS NULL
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Non-attended bookings do not keep attendance timestamps",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "SessionBooking"
      WHERE "status" <> 'ATTENDED'
        AND "attendedAt" IS NOT NULL
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Private sessions have at most one active booking",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT s."id"
        FROM "TrainingSession" s
        INNER JOIN "SessionBooking" b ON b."trainingSessionId" = s."id"
        WHERE s."type" = 'PRIVATE'
          AND s."status" <> 'CANCELED'
          AND b."status" IN ('BOOKED', 'ATTENDED', 'WAITLIST')
        GROUP BY s."id"
        HAVING COUNT(*) > 1
      ) violations
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Group sessions do not exceed configured capacity",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT s."id", s."capacity", COUNT(b."id") AS active_bookings
        FROM "TrainingSession" s
        INNER JOIN "SessionBooking" b ON b."trainingSessionId" = s."id"
        WHERE s."type" = 'GROUP'
          AND s."status" <> 'CANCELED'
          AND s."capacity" IS NOT NULL
          AND b."status" IN ('BOOKED', 'ATTENDED', 'WAITLIST')
        GROUP BY s."id", s."capacity"
        HAVING COUNT(b."id") > s."capacity"
      ) violations
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Subscription plans use valid commercial values",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "SubscriptionPlan"
      WHERE "price" <= 0
        OR (
          "sessionsIncluded" IS NOT NULL
          AND "sessionsIncluded" <= 0
        )
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Subscription usage does not exceed allocated sessions",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "ClientSubscription"
      WHERE "sessionsTotal" IS NOT NULL
        AND "sessionsUsed" > "sessionsTotal"
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Subscription payments belong to the same client as their subscription",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "Payment" p
      INNER JOIN "ClientSubscription" cs ON cs."id" = p."clientSubscriptionId"
      WHERE p."clientId" <> cs."clientId"
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Payments use positive amounts",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "Payment"
      WHERE "amount" <= 0
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Subscription custom prices are positive when set",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "ClientSubscription"
      WHERE "customPrice" IS NOT NULL
        AND "customPrice" <= 0
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Default studio settings row is complete when present",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "StudioSettings"
      WHERE "id" = 'default'
        AND (
          trim("studioName") = ''
          OR trim("supportEmail") = ''
          OR trim("timezone") = ''
        )
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Session notes have content",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "SessionNote"
      WHERE trim("content") = ''
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Workout notes have content",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "WorkoutNote"
      WHERE trim("content") = ''
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Converted leads have client accounts",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "Lead" l
      WHERE l."status" = 'CONVERTED'
        AND l."email" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "User" u
          INNER JOIN "Client" c ON c."userId" = u."id"
          WHERE u."email" = lower(trim(l."email"))
            AND u."role" = 'CLIENT'
        )
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Client profiles point to client-role users",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "Client" c
      INNER JOIN "User" u ON u."id" = c."userId"
      WHERE u."role" <> 'CLIENT'
    `,
    failWhen: (count) => count > 0,
  },
  {
    name: "Coach profiles point to coach-role users",
    sql: `
      SELECT COUNT(*)::int AS count
      FROM "Coach" c
      INNER JOIN "User" u ON u."id" = c."userId"
      WHERE u."role" <> 'COACH'
    `,
    failWhen: (count) => count > 0,
  },
];

function assertRequiredEnv() {
  const missing = ["DATABASE_URL", "AUTH_SECRET"].filter(
    (name) => !process.env[name]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
}

async function main() {
  assertRequiredEnv();

  const pool = new Pool({ connectionString });
  const failures = [];

  try {
    for (const check of checks) {
      const result = await pool.query(check.sql);
      const count = Number(result.rows[0]?.count ?? 0);
      const failed = check.failWhen(count);
      const icon = failed ? "x" : "ok";

      console.log(`${icon} ${check.name}: ${count}`);

      if (failed) {
        failures.push(`${check.name} (${count})`);
      }
    }
  } finally {
    await pool.end();
  }

  if (failures.length > 0) {
    console.error("\nBackend smoke check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nBackend smoke check passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
