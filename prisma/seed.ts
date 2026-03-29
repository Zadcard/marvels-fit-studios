import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "admin@marvelsfit.com" },
    update: {},
    create: {
      email: "admin@marvelsfit.com",
      password: hashedPassword,
    },
  });

  console.log("✅ Super Admin created:", superAdmin.email);
  console.log("🔑 Login password: admin123");
  console.log("⚠️ Change this password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
