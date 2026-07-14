import "server-only";

import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  async get(): Promise<AdminStudioSettings> {
    return withSupabaseFallback(
      async () => {
        const { data, error } = await getSupabaseServerClient()
          .from("StudioSettings")
          .upsert({ id: DEFAULT_SETTINGS_ID, ...defaultSettings })
          .select(
            "studioName,supportEmail,supportPhone,timezone,defaultSessionLength,intakeLeadTime,overbookWaitlist,cancellationWindow,privateSessionBuffer,scheduleStartDay"
          )
          .single();
        if (error) throw error;
        return data;
      },
      defaultSettings
    );
  }
}

export const adminSettingsRepository = new AdminSettingsRepository();
