"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  const { data, error } = await getSupabaseServerClient()
    .from("Notification")
    .update({ status: "READ", readAt: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipientId", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Notification not found.");
  if (user.role === UserRole.ADMIN) {
    revalidatePath("/admin/notifications");
  } else if (user.role === UserRole.COACH) {
    revalidatePath("/coach/alerts");
  }
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  const readAt = new Date().toISOString();
  const { error } = await getSupabaseServerClient()
    .from("Notification")
    .update({ status: "READ", readAt })
    .eq("recipientId", user.id)
    .neq("status", "FAILED")
    .is("readAt", null);
  if (error) throw error;

  if (user.role === UserRole.ADMIN) {
    revalidatePath("/admin/notifications");
  } else if (user.role === UserRole.COACH) {
    revalidatePath("/coach/alerts");
  }
}
