import "server-only";

import { UserRole } from "@/lib/supabase/domain";

import { auth } from "@/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { throwIfSupabaseError } from "@/lib/supabase/errors";

const sessionUserColumns = "id,email,name,mustChangePassword,role" as const;

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

async function ensurePersistedSessionUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
}) {
  const { data: persistedUser, error } = await getSupabaseServerClient()
    .from("User")
    .select(sessionUserColumns)
    .eq("id", sessionUser.id)
    .maybeSingle();

  throwIfSupabaseError("load authenticated user", error);

  if (!persistedUser) {
    throw new UnauthorizedError();
  }

  return persistedUser;
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return ensurePersistedSessionUser(session.user);
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (user.role !== role) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function requireAnyRole(...roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    throw new UnauthorizedError();
  }

  return user;
}
