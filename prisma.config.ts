import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// TODO: Rotate Neon database credentials (password leaked)
// TODO: Regenerate AUTH_SECRET

loadEnv({ path: ".env.local", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const prismaCliDatabaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --esm prisma/seed.ts",
  },
  datasource: {
    url: prismaCliDatabaseUrl,
  },
});
