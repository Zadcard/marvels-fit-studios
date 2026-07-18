import "server-only";

import type { AdminStudioSettings } from "@/lib/mocks/admin-settings";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_SETTINGS_ID = "default";
const SETTINGS_SELECT =
  "studioName,supportEmail,supportPhone,timezone,defaultSessionLength,intakeLeadTime,overbookWaitlist,cancellationWindow,privateSessionBuffer,scheduleStartDay";

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
        const client = getSupabaseServerClient();
        const { data: existingSettings, error: selectError } = await client
          .from("StudioSettings")
          .select(SETTINGS_SELECT)
          .eq("id", DEFAULT_SETTINGS_ID)
          .maybeSingle();
        if (selectError) throw selectError;
        if (existingSettings) return existingSettings;

        const { data: insertedSettings, error: insertError } = await client
          .from("StudioSettings")
          .insert({ id: DEFAULT_SETTINGS_ID, ...defaultSettings })
          .select(SETTINGS_SELECT)
          .single();
        if (insertError) throw insertError;
        return insertedSettings;
      },
      defaultSettings
    );
  }
}

export const adminSettingsRepository = new AdminSettingsRepository();
