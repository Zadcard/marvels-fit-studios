import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL.");
}

const extractedCoaches = [
  {
    fullName: "Youssef",
    email: "coach.youssef@marvels-fit.local",
    specialization: "PRIVATE_COACHING",
  },
  {
    fullName: "Waheed",
    email: "coach.waheed@marvels-fit.local",
    specialization: "PRIVATE_COACHING",
  },
  {
    fullName: "Farouk",
    email: "coach.farouk@marvels-fit.local",
    specialization: "PRIVATE_COACHING",
  },
  {
    fullName: "Zaki",
    email: "coach.zaki@marvels-fit.local",
    specialization: "PRIVATE_COACHING",
  },
  {
    fullName: "Hisham",
    email: "coach.hisham@marvels-fit.local",
    specialization: "PRIVATE_COACHING",
  },
  {
    fullName: "Ali",
    email: "coach.ali@marvels-fit.local",
    specialization: "CONDITIONING",
  },
  {
    fullName: "Hassan",
    email: "coach.hassan@marvels-fit.local",
    specialization: "CONDITIONING",
  },
  {
    fullName: "Hamooda",
    email: "coach.hamooda@marvels-fit.local",
    specialization: "CONDITIONING",
  },
  {
    fullName: "Reham",
    email: "coach.reham@marvels-fit.local",
    specialization: "CONDITIONING",
  },
  {
    fullName: "Yasmeen",
    email: "coach.yasmeen@marvels-fit.local",
    specialization: "MOBILITY",
  },
  {
    fullName: "Shnoda",
    email: "coach.shnoda@marvels-fit.local",
    specialization: "STRENGTH",
  },
  {
    fullName: "Hoda",
    email: "coach.hoda@marvels-fit.local",
    specialization: "MOBILITY",
  },
];

const pool = new Pool({
  connectionString,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const results = [];

  for (const coachInput of extractedCoaches) {
    const existingCoach = await prisma.coach.findFirst({
      where: {
        fullName: {
          equals: coachInput.fullName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        fullName: true,
        userId: true,
      },
    });

    if (existingCoach) {
      await prisma.user.update({
        where: {
          id: existingCoach.userId,
        },
        data: {
          name: coachInput.fullName,
          email: coachInput.email,
          role: "COACH",
        },
      });

      await prisma.coach.update({
        where: {
          id: existingCoach.id,
        },
        data: {
          fullName: coachInput.fullName,
          specialization: coachInput.specialization,
        },
      });

      results.push({
        fullName: coachInput.fullName,
        action: "updated",
      });
      continue;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: coachInput.email,
      },
      select: {
        id: true,
        coachProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (existingUser?.coachProfile) {
      await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          name: coachInput.fullName,
          role: "COACH",
        },
      });

      await prisma.coach.update({
        where: {
          id: existingUser.coachProfile.id,
        },
        data: {
          fullName: coachInput.fullName,
          specialization: coachInput.specialization,
        },
      });

      results.push({
        fullName: coachInput.fullName,
        action: "updated",
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            name: coachInput.fullName,
            email: coachInput.email,
            role: "COACH",
          },
          select: {
            id: true,
          },
        }));

      await tx.coach.create({
        data: {
          fullName: coachInput.fullName,
          specialization: coachInput.specialization,
          userId: user.id,
        },
      });
    });

    results.push({
      fullName: coachInput.fullName,
      action: "created",
    });
  }

  console.log(JSON.stringify({ count: results.length, results }, null, 2));
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
