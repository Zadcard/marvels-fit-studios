import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  console.log("🌱 Seeding database...");

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email: "admin@test.com",
      name: "System Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin created: admin@test.com");

  // 2. Coach
  const coachUser = await prisma.user.upsert({
    where: { email: "coach@test.com" },
    update: {
      password: hashedPassword,
      role: "COACH",
    },
    create: {
      email: "coach@test.com",
      name: "Coach User",
      password: hashedPassword,
      role: "COACH",
    },
  });

  await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      fullName: "Coach User",
      userId: coachUser.id,
    },
  });
  console.log("✅ Coach created: coach@test.com");

  // 3. Client
  const clientUser = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {
      password: hashedPassword,
      role: "CLIENT",
    },
    create: {
      email: "client@test.com",
      name: "Client User",
      password: hashedPassword,
      role: "CLIENT",
    },
  });

  await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      fullName: "Client User",
      userId: clientUser.id,
    },
  });
  console.log("✅ Client created: client@test.com");

  console.log("\n✨ Seeding complete!");
  console.log("🔑 Password for all users: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
