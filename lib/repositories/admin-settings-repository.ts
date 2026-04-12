import "server-only";

import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import { getPrisma } from "@/lib/prisma";

const DEFAULT_SETTINGS_ID = "default";

const defaultSettings: AdminStudioSettings = {
  studioName: "Marvel Fitness Studio",
  supportEmail: "hello@marvelfitness.studio",
  supportPhone: "+20 10 5555 9084",
  timezone: "Africa/Cairo",
  defaultSessionLength: "60 minutes",
  intakeLeadTime: "24 hours",
  overbookWaitlist: true,
  coachAutoReminders: true,
  memberCheckInAlerts: true,
  renewalDigest: false,
  cancellationWindow: "6 hours",
  privateSessionBuffer: "15 minutes",
  scheduleStartDay: "Monday",
};

export class AdminSettingsRepository {
  private prisma = getPrisma();

  async get(): Promise<AdminStudioSettings> {
    const settings = await this.prisma.studioSettings.upsert({
      where: { id: DEFAULT_SETTINGS_ID },
      create: {
        id: DEFAULT_SETTINGS_ID,
        ...defaultSettings,
      },
      update: {},
      select: {
        studioName: true,
        supportEmail: true,
        supportPhone: true,
        timezone: true,
        defaultSessionLength: true,
        intakeLeadTime: true,
        overbookWaitlist: true,
        coachAutoReminders: true,
        memberCheckInAlerts: true,
        renewalDigest: true,
        cancellationWindow: true,
        privateSessionBuffer: true,
        scheduleStartDay: true,
      },
    });

    return settings;
  }
}

export const adminSettingsRepository = new AdminSettingsRepository();
