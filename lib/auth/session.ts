import "server-only";

import { UserRole } from "@/lib/supabase/domain";

import { auth } from "@/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const sessionUserColumns = "id,email,name,mustChangePassword,role" as const;

async function ensurePersistedSessionUser(sessionUser: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole;
}) {
  const supabase = getSupabaseServerClient();
  try {
    const { data: existingById, error: idError } = await supabase
      .from("User")
      .select(sessionUserColumns)
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (idError) throw idError;

    if (existingById) {
      return existingById;
    }

    if (!sessionUser.email || !sessionUser.role) {
      throw new Error("Unauthorized");
    }

    const { data: existingByEmail, error: emailError } = await supabase
      .from("User")
      .select(sessionUserColumns)
      .eq("email", sessionUser.email)
      .maybeSingle();

    if (emailError) throw emailError;

    if (existingByEmail) {
      return existingByEmail;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Unauthorized");
    }

    const { data: createdUser, error: createError } = await supabase
      .from("User")
      .insert({
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name ?? sessionUser.email,
        role: sessionUser.role,
      })
      .select(sessionUserColumns)
      .single();

    if (createError) throw createError;

    const fullName = sessionUser.name ?? sessionUser.email;
    if (sessionUser.role === UserRole.COACH) {
      const { error } = await supabase
        .from("Coach")
        .insert({ fullName, userId: createdUser.id });
      if (error) throw error;
    } else if (sessionUser.role === UserRole.CLIENT) {
      const { error } = await supabase
        .from("Client")
        .insert({ fullName, userId: createdUser.id });
      if (error) throw error;
    }

    return createdUser;
  } catch (error) {
    if (sessionUser.role) {
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
