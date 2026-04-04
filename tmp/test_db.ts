import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Connecting...");
    console.log("URL:", process.env.DATABASE_URL?.substring(0, 20) + "...");
    const userCount = await prisma.user.count();
    console.log("✅ Connection successful!");
    console.log("User count:", userCount);
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
