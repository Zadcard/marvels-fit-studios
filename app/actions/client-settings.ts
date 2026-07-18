"use server";

import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import type { ClientSettingsRecord } from "@/lib/dashboard/client-dashboard-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function normalizeSettings(input: ClientSettingsRecord): ClientSettingsRecord {
  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    goalLabel: input.goalLabel.trim(),
    preferredSessionTime: input.preferredSessionTime.trim(),
  };
}

export async function saveClientSettings(input: ClientSettingsRecord) {
  const user = await requireRole(UserRole.CLIENT);
  const settings = normalizeSettings(input);

  if (!settings.fullName) {
    throw new Error("Client full name is required.");
  }

  if (!settings.email) {
    throw new Error("Client email is required.");
  }

  const { error } = await getSupabaseServerClient().rpc("save_client_settings", {
    p_email: settings.email,
    p_full_name: settings.fullName,
    p_goal_label: settings.goalLabel,
    p_phone: settings.phone,
    p_preferred_session_time: settings.preferredSessionTime,
    p_user_id: user.id,
  });
  if (error?.code === "23505") throw new Error("Another user already uses this email.");
  if (error?.code === "P0002") throw new Error("Client profile not found.");
  if (error) throw error;

}
