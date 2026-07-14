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
