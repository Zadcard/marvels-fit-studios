import "server-only";

import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import { getPrisma, withPrismaFallback } from "@/lib/prisma";

const DEFAULT_SETTINGS_ID = "default";

const defaultSettings: AdminStudioSettings = {
  studioName: "Marvel Fitness Studio",
  supportEmail: "hello@marvelfitness.studio",
  supportPhone: "+20 10 5555 9084",
  timezone: "Africa/Cairo",
  defaultSessionLength: "60 minutes",
  intakeLeadTime: "24 hours",
  overbookWaitlist: true,
  cancellationWindow: "6 hours",
  privateSessionBuffer: "15 minutes",
  scheduleStartDay: "Monday",
};

export class AdminSettingsRepository {
  private get prisma() {
    return getPrisma();
  }

  async get(): Promise<AdminStudioSettings> {
    return withPrismaFallback(
      () =>
        this.prisma.studioSettings.upsert({
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
            cancellationWindow: true,
            privateSessionBuffer: true,
            scheduleStartDay: true,
          },
        }),
      defaultSettings
    );
  }
}

export const adminSettingsRepository = new AdminSettingsRepository();
