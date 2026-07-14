"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SaveAdminProfileInput = {
  fullName: string;
  email: string;
};

export async function saveAdminProfile(input: SaveAdminProfileInput) {
  const user = await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) {
    throw new Error("Admin full name is required.");
  }

  if (!email) {
    throw new Error("Admin email is required.");
  }

  const { data: existingUser, error: findError } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (findError) throw findError;

  if (existingUser && existingUser.id !== user.id) {
    throw new Error("Another user already uses this email.");
  }

  const { error } = await supabase
    .from("User")
    .update({ name: fullName, email })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/profile");
}
