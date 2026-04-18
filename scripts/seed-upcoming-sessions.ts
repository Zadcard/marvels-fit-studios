import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAY_TO_JS: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m ?? 0 };
}

function nextOccurrence(fromDate: Date, targetJsDay: number, hours: number, minutes: number): Date {
  const d = new Date(fromDate);
  d.setHours(hours, minutes, 0, 0);
  const daysAhead = (targetJsDay - d.getDay() + 7) % 7;
  if (daysAhead === 0 && d <= fromDate) {
    d.setDate(d.getDate() + 7);
  } else {
    d.setDate(d.getDate() + daysAhead);
  }
  return d;
}

async function main() {
  const now = new Date();

  // Find admin user to use as createdBy
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) throw new Error("No admin user found");

  const blocks = await prisma.scheduleBlock.findMany({
    where: { status: "ACTIVE" },
    include: {
      group: true,
      coach: true,
    },
  });

  console.log(`Found ${blocks.length} active schedule blocks`);

  let created = 0;
  let skipped = 0;

  for (const block of blocks) {
    const start = parseTime(block.startTime);
    const end = parseTime(block.endTime);

    // Generate sessions for the next 14 days
    for (const day of block.recurrenceDays) {
      const jsDay = DAY_TO_JS[day];
      if (jsDay === undefined) continue;

      // Find next 2 occurrences of this day
      let cursor = new Date(now);
      for (let i = 0; i < 2; i++) {
        const sessionStart = nextOccurrence(cursor, jsDay, start.hours, start.minutes);

        // Stop if beyond 14 days from now
        if (sessionStart.getTime() > now.getTime() + 14 * 24 * 60 * 60 * 1000) break;

        const sessionEnd = new Date(sessionStart);
        sessionEnd.setHours(end.hours, end.minutes, 0, 0);

        // Check if session already exists for this block+time
        const existing = await prisma.trainingSession.findFirst({
          where: {
            scheduleBlockId: block.id,
            startsAt: sessionStart,
          },
        });

        if (existing) {
          skipped++;
          cursor = new Date(sessionStart.getTime() + 1);
          continue;
        }

        const title = block.title;

        await prisma.trainingSession.create({
          data: {
            title,
            type: block.sessionType,
            status: "SCHEDULED",
            startsAt: sessionStart,
            endsAt: sessionEnd,
            capacity: block.capacity,
            location: block.location,
            coachId: block.coachId,
            groupId: block.groupId,
            scheduleBlockId: block.id,
            createdById: adminUser.id,
          },
        });

        created++;
        console.log(`  Created: ${title} on ${sessionStart.toISOString()}`);
        cursor = new Date(sessionStart.getTime() + 1);
      }
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
