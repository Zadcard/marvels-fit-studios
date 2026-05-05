import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env files only in local dev — Vercel injects env vars directly.
if (!process.env.VERCEL) {
  if (!process.env.DATABASE_URL) {
    loadEnv({ path: ".env.local" });
  }
  if (!process.env.DATABASE_URL) {
    loadEnv({ path: ".env" });
  }
}

// Only override the schema datasource when a URL is explicitly available.
// prisma generate does not need a live connection; the schema's env("DATABASE_URL")
// handles runtime. Throwing here blocks generate on Vercel unnecessarily.
const prismaCliDatabaseUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --esm prisma/seed.ts",
  },
  ...(prismaCliDatabaseUrl
    ? { datasource: { url: prismaCliDatabaseUrl } }
    : {}),
});
