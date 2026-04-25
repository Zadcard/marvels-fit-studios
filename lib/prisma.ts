import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
  prismaPool: Pool | undefined;
};

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing from environment");
  }

  return connectionString;
}

function getPrismaAdapter() {
  if (!globalForPrisma.prismaPool) {
    globalForPrisma.prismaPool = new Pool({
      connectionString: getConnectionString(),
    });
  }

  if (!globalForPrisma.prismaAdapter) {
    globalForPrisma.prismaAdapter = new PrismaPg(globalForPrisma.prismaPool);
  }

  return globalForPrisma.prismaAdapter;
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ adapter: getPrismaAdapter() });
  }

  return globalForPrisma.prisma;
}

export async function resetPrisma() {
  const prisma = globalForPrisma.prisma;
  const pool = globalForPrisma.prismaPool;

  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaAdapter = undefined;
  globalForPrisma.prismaPool = undefined;

  if (prisma) {
    await prisma.$disconnect().catch(() => undefined);
  }

  if (pool) {
    await pool.end().catch(() => undefined);
  }
}

export function isRecoverablePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2021" ||
      error.code === "P2022" ||
      error.message.includes("Server has closed the connection") ||
      error.message.includes("Connection terminated unexpectedly") ||
      error.message.includes("Can't reach database server")
    );
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return (
      error.message.includes("Server has closed the connection") ||
      error.message.includes("Connection terminated unexpectedly") ||
      error.message.includes("Can't reach database server")
    );
  }

  if (error instanceof Error) {
    return (
      error.message.includes("Server has closed the connection") ||
      error.message.includes("Connection terminated unexpectedly") ||
      error.message.includes("Can't reach database server")
    );
  }

  return false;
}

export async function withPrismaFallback<T>(
  operation: () => Promise<T>,
  fallback: T
) {
  try {
    return await operation();
  } catch (error) {
    if (!isRecoverablePrismaError(error)) {
      throw error;
    }

    try {
      await resetPrisma();
      return await operation();
    } catch (retryError) {
      if (isRecoverablePrismaError(retryError)) {
        return fallback;
      }

      throw retryError;
    }
  }
}
