import "server-only";

import type { CoachSettingsRecord } from "@/lib/mocks/coach-settings";
import type { Database } from "@/lib/supabase/database.types";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function toCoachSpecializationLabel(
  specialization: Database["public"]["Enums"]["CoachSpecialization"]
) {
  switch (specialization) {
    case "CONDITIONING":
      return "Conditioning";
    case "MOBILITY":
      return "Mobility";
    case "PRIVATE_COACHING":
      return "Private Coaching";
    case "FOOTBALL":
      return "Football";
    case "TENNIS":
      return "Tennis";
    case "CALISTHENICS":
      return "Calisthenics";
    case "REHAB":
      return "Rehab";
    case "ATHLETIC_PERFORMANCE":
      return "Athletic Performance";
    case "GENERAL_FITNESS":
      return "General Fitness";
    default:
      return "Strength";
  }
}

export class CoachSettingsRepository {
  async getByUserId(userId: string): Promise<CoachSettingsRecord | null> {
    return withSupabaseFallback(async () => {
      const { data: user, error } = await getSupabaseServerClient()
        .from("User")
        .select("id,name,email,coachProfile:Coach(id,fullName,phone,specialization)")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;

      const coachProfile = user?.coachProfile[0];

      if (!coachProfile) {
        return null;
      }

      return {
        fullName: coachProfile.fullName,
        roleLabel: "Coach",
        email: user.email ?? "No email",
        phone: coachProfile.phone ?? "No phone",
        bio: "Coach profile details are now persisted through your main account fields.",
        specialization: toCoachSpecializationLabel(coachProfile.specialization),
        preferredView: "Sessions list",
        reminderLeadTime: "30 minutes",
        availabilityNote: "Availability is currently coordinated through assigned sessions and schedules.",
        mobileAlerts: true,
        clientCheckIns: true,
        waitlistFlags: true,
      };
    }, null);
  }
}

export const coachSettingsRepository = new CoachSettingsRepository();
