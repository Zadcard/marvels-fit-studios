import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function listNotifications(recipientId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("Notification")
    .select("id, kind, status, title, body, href, sentAt, readAt")
    .eq("recipientId", recipientId)
    .order("createdAt", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function countUnreadNotifications(recipientId: string) {
  const { count, error } = await getSupabaseServerClient()
    .from("Notification")
    .select("id", { count: "exact", head: true })
    .eq("recipientId", recipientId)
    .is("readAt", null)
    .neq("status", "FAILED");
  if (error) throw error;
  return count ?? 0;
}
