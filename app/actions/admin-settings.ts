"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_SETTINGS_ID = "default";

function normalizeSettings(input: AdminStudioSettings): AdminStudioSettings {
  return {
    studioName: input.studioName.trim(),
    supportEmail: input.supportEmail.trim().toLowerCase(),
    supportPhone: input.supportPhone.trim(),
    timezone: input.timezone.trim(),
    defaultSessionLength: input.defaultSessionLength.trim(),
    intakeLeadTime: input.intakeLeadTime.trim(),
    overbookWaitlist: input.overbookWaitlist,
    cancellationWindow: input.cancellationWindow.trim(),
    privateSessionBuffer: input.privateSessionBuffer.trim(),
    scheduleStartDay: input.scheduleStartDay.trim(),
  };
}

export async function saveAdminSettings(input: AdminStudioSettings) {
  await requireRole(UserRole.ADMIN);
  const settings = normalizeSettings(input);

  if (!settings.studioName) {
    throw new Error("Studio name is required.");
  }

  if (!settings.supportEmail) {
    throw new Error("Support email is required.");
  }

  if (!settings.timezone) {
    throw new Error("Timezone is required.");
  }

  const { error } = await getSupabaseServerClient()
    .from("StudioSettings")
    .upsert({ id: DEFAULT_SETTINGS_ID, ...settings });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/schedule");
}
