"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import { getPrisma } from "@/lib/prisma";

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
    coachAutoReminders: input.coachAutoReminders,
    memberCheckInAlerts: input.memberCheckInAlerts,
    renewalDigest: input.renewalDigest,
    cancellationWindow: input.cancellationWindow.trim(),
    privateSessionBuffer: input.privateSessionBuffer.trim(),
    scheduleStartDay: input.scheduleStartDay.trim(),
  };
}

export async function saveAdminSettings(input: AdminStudioSettings) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();
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

  await prisma.studioSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    create: {
      id: DEFAULT_SETTINGS_ID,
      ...settings,
    },
    update: settings,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/schedule");
}
