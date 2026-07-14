"use server";

import { CoachSpecialization, UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SaveCoachSettingsInput = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
};

function toCoachSpecialization(
  specialization: string
): CoachSpecialization {
  switch (specialization) {
    case "Conditioning":
      return CoachSpecialization.CONDITIONING;
    case "Mobility":
      return CoachSpecialization.MOBILITY;
    case "Private Coaching":
      return CoachSpecialization.PRIVATE_COACHING;
    default:
      return CoachSpecialization.STRENGTH;
  }
}

export async function saveCoachSettings(input: SaveCoachSettingsInput) {
  const user = await requireRole(UserRole.COACH);
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const specialization = toCoachSpecialization(input.specialization);

  if (!fullName) {
    throw new Error("Coach full name is required.");
  }

  if (!email) {
    throw new Error("Coach email is required.");
  }

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
  revalidatePath("/coach/settings");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/sessions");
}
