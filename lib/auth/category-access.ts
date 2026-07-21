import "server-only";

import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/domain";

export type CategoryWriteAccess = {
  userId: string;
  role: Extract<UserRole, "ADMIN" | "COACH">;
  coachId: string | null;
};

export async function getCoachIdForUserId(userId: string): Promise<string | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("Coach")
    .select("id")
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getSupervisedCategoryIdsForUserId(userId: string): Promise<string[]> {
  const coachId = await getCoachIdForUserId(userId);
  if (!coachId) return [];
  const { data, error } = await getSupabaseServerClient()
    .from("CategorySupervisor")
    .select("categoryId")
    .eq("coachId", coachId);
  if (error) throw error;
  return data.map((item) => item.categoryId);
}

export async function requireCategoryWriteAccess(categoryId: string): Promise<CategoryWriteAccess> {
  const user = await requireUser();
  if (user.role === UserRole.ADMIN) {
    return { userId: user.id, role: UserRole.ADMIN, coachId: null };
  }
  if (user.role !== UserRole.COACH) throw new UnauthorizedError();

  const coachId = await getCoachIdForUserId(user.id);
  if (!coachId) throw new UnauthorizedError();
  const { data, error } = await getSupabaseServerClient()
    .from("CategorySupervisor")
    .select("categoryId")
    .eq("categoryId", categoryId)
    .eq("coachId", coachId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new UnauthorizedError();

  return { userId: user.id, role: UserRole.COACH, coachId };
}
