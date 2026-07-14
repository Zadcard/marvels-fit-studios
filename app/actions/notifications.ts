"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
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
  revalidatePath(`/${user.role.toLowerCase()}/notifications`);
}
