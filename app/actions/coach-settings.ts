"use server";

import { CoachSpecialization, UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const specializationValues = [
  "Strength",
  "Conditioning",
  "Mobility",
  "Private Coaching",
  "Football",
  "Tennis",
  "Calisthenics",
  "Rehab",
  "Athletic Performance",
  "General Fitness",
] as const;

const saveCoachSettingsSchema = z.object({
  fullName: z.string().trim().min(1, "Coach full name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z.string().trim().max(30),
  specialization: z.enum(specializationValues),
});

export type SaveCoachSettingsInput = z.infer<typeof saveCoachSettingsSchema>;

const specializationMap: Record<SaveCoachSettingsInput["specialization"], CoachSpecialization> = {
  Strength: CoachSpecialization.STRENGTH,
  Conditioning: CoachSpecialization.CONDITIONING,
  Mobility: CoachSpecialization.MOBILITY,
  "Private Coaching": CoachSpecialization.PRIVATE_COACHING,
  Football: CoachSpecialization.FOOTBALL,
  Tennis: CoachSpecialization.TENNIS,
  Calisthenics: CoachSpecialization.CALISTHENICS,
  Rehab: CoachSpecialization.REHAB,
  "Athletic Performance": CoachSpecialization.ATHLETIC_PERFORMANCE,
  "General Fitness": CoachSpecialization.GENERAL_FITNESS,
};

export async function saveCoachSettings(input: SaveCoachSettingsInput) {
  const user = await requireRole(UserRole.COACH);
  const parsed = saveCoachSettingsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid coach settings.");
  }
  const { fullName, email, phone } = parsed.data;
  const specialization = specializationMap[parsed.data.specialization];

  const { error } = await getSupabaseServerClient().rpc("save_coach_settings", {
    p_email: email,
    p_full_name: fullName,
    p_phone: phone,
    p_specialization: specialization,
    p_user_id: user.id,
  });
  if (error?.code === "23505") {
    throw new Error("Another user already uses this email.");
  }
  if (error?.code === "P0002") {
    throw new Error("Coach profile not found.");
  }
  if (error) throw error;

  revalidatePath("/coach");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/coach/settings");
  revalidatePath("/admin/coaches");
}
