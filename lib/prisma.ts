import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
  prismaPool: Pool | undefined;
  prismaResetPromise: Promise<void> | undefined;
};

function getPrismaAdapter() {
  if (!globalForPrisma.prismaPool) {
    // Pool does not connect until first query — safe to construct without DATABASE_URL
    // at module load time (e.g. during Next.js build). The connection string is
    // resolved from process.env at runtime when the first query executes.
    globalForPrisma.prismaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
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

function getPrismaErrorSummary(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { name: error.name, code: error.code };
  }

  if (error instanceof Error) {
    return { name: error.name };
  }

  return { name: typeof error };
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
        console.warn("[prisma] Read operation failed after retry. Returning fallback.", {
          initialError: getPrismaErrorSummary(error),
          retryError: getPrismaErrorSummary(retryError),
        });
        return fallback;
      }

      throw retryError;
    }
  }
}
