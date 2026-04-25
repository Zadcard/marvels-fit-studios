import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
  prismaPool: Pool | undefined;
  prismaResetPromise: Promise<void> | undefined;
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

async function resetPrismaInternal() {
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

export async function resetPrisma() {
  if (!globalForPrisma.prismaResetPromise) {
    globalForPrisma.prismaResetPromise = resetPrismaInternal().finally(() => {
      globalForPrisma.prismaResetPromise = undefined;
    });
  }

  await globalForPrisma.prismaResetPromise;
}

function getPrismaErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.toLowerCase() : "";
}

function isPrismaClientError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError
  );
}

export function isRecoverablePrismaError(error: unknown) {
  const message = getPrismaErrorMessage(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2021" ||
      error.code === "P2022" ||
      message.includes("server has closed the connection") ||
      message.includes("server closed the connection unexpectedly") ||
      message.includes("connection terminated unexpectedly") ||
      message.includes("connection ended unexpectedly") ||
      message.includes("terminating connection") ||
      message.includes("can't reach database server")
    );
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return (
      message.includes("server has closed the connection") ||
      message.includes("server closed the connection unexpectedly") ||
      message.includes("connection terminated unexpectedly") ||
      message.includes("connection ended unexpectedly") ||
      message.includes("terminating connection") ||
      message.includes("can't reach database server")
    );
  }

  if (error instanceof Error) {
    return (
      message.includes("server has closed the connection") ||
      message.includes("server closed the connection unexpectedly") ||
      message.includes("connection terminated unexpectedly") ||
      message.includes("connection ended unexpectedly") ||
      message.includes("terminating connection") ||
      message.includes("can't reach database server")
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
      if (isRecoverablePrismaError(retryError) || isPrismaClientError(retryError)) {
        console.error("[prisma] Read operation failed after retry. Returning fallback.", {
          initialError:
            error instanceof Error ? error.message : String(error),
          retryError:
            retryError instanceof Error ? retryError.message : String(retryError),
        });
        return fallback;
      }

      throw retryError;
    }
  }
}
