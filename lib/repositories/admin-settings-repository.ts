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
    await this.prisma.$executeRaw`
      INSERT INTO "StudioSettings" (
        "id",
        "studioName",
        "supportEmail",
        "supportPhone",
        "timezone",
        "defaultSessionLength",
        "intakeLeadTime",
        "overbookWaitlist",
        "coachAutoReminders",
        "memberCheckInAlerts",
        "renewalDigest",
        "cancellationWindow",
        "privateSessionBuffer",
        "scheduleStartDay",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${DEFAULT_SETTINGS_ID},
        ${defaultSettings.studioName},
        ${defaultSettings.supportEmail},
        ${defaultSettings.supportPhone},
        ${defaultSettings.timezone},
        ${defaultSettings.defaultSessionLength},
        ${defaultSettings.intakeLeadTime},
        ${defaultSettings.overbookWaitlist},
        ${defaultSettings.coachAutoReminders},
        ${defaultSettings.memberCheckInAlerts},
        ${defaultSettings.renewalDigest},
        ${defaultSettings.cancellationWindow},
        ${defaultSettings.privateSessionBuffer},
        ${defaultSettings.scheduleStartDay},
        NOW(),
        NOW()
      )
      ON CONFLICT ("id") DO NOTHING
    `;

    const rows = await this.prisma.$queryRaw<AdminStudioSettings[]>`
      SELECT
        "studioName",
        "supportEmail",
        "supportPhone",
        "timezone",
        "defaultSessionLength",
        "intakeLeadTime",
        "overbookWaitlist",
        "coachAutoReminders",
        "memberCheckInAlerts",
        "renewalDigest",
        "cancellationWindow",
        "privateSessionBuffer",
        "scheduleStartDay"
      FROM "StudioSettings"
      WHERE "id" = ${DEFAULT_SETTINGS_ID}
      LIMIT 1
    `;

    return rows[0] ?? defaultSettings;
  }
}

export const adminSettingsRepository = new AdminSettingsRepository();
