import "server-only";

import { Prisma, UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

function isRecoverablePrismaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function ensurePersistedSessionUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
}) {
  const prisma = getPrisma();
  try {
    const existingById = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        mustChangePassword: true,
        role: true,
      },
    });

    if (existingById) {
      return existingById;
    }

    if (!sessionUser.email || !sessionUser.role) {
      throw new Error("Unauthorized");
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        mustChangePassword: true,
        role: true,
      },
    });

    if (existingByEmail) {
      return existingByEmail;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Unauthorized");
    }

    return prisma.user.create({
      data: {
        email: sessionUser.email,
        name: sessionUser.name ?? sessionUser.email,
        role: sessionUser.role,
        coachProfile:
          sessionUser.role === UserRole.COACH
            ? {
                create: {
                  fullName: sessionUser.name ?? sessionUser.email,
                },
              }
            : undefined,
        clientProfile:
          sessionUser.role === UserRole.CLIENT
            ? {
                create: {
                  fullName: sessionUser.name ?? sessionUser.email,
                },
              }
            : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        mustChangePassword: true,
        role: true,
      },
    });
  } catch (error) {
    if (isRecoverablePrismaError(error) && sessionUser.role) {
      return {
        id: sessionUser.id,
        email: sessionUser.email ?? null,
        name: sessionUser.name ?? sessionUser.email ?? null,
        mustChangePassword: false,
        role: sessionUser.role,
      };
    }

    throw error;
  }
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return ensurePersistedSessionUser(session.user);
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (user.role !== role) {
    throw new Error("Unauthorized");
  }

  return user;
}
