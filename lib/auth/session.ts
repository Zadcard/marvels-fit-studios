import "server-only";

import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

async function ensurePersistedSessionUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
}) {
  const prisma = getPrisma();

  const existingById = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
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
      role: true,
    },
  });
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
