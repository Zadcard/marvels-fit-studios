import type { UserRole } from "@/lib/supabase/domain";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PersistedAuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  password: string | null;
  mustChangePassword: boolean;
  role: UserRole;
};

export interface UserRepository {
  findByEmail(email: string): Promise<PersistedAuthUser | null>;
  findById(id: string): Promise<PersistedAuthUser | null>;
}

const authUserColumns =
  "id,email,name,password,mustChangePassword,role" as const;

async function findUser(
  column: "email" | "id",
  value: string
): Promise<PersistedAuthUser | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("User")
    .select(authUserColumns)
    .eq(column, value)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export class SupabaseUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<PersistedAuthUser | null> {
    return findUser("email", email);
  }

  async findById(id: string): Promise<PersistedAuthUser | null> {
    return findUser("id", id);
  }
}
