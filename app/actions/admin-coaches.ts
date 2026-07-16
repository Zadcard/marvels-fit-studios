"use server";

import bcrypt from "bcryptjs";
import { CoachSpecialization, UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SaveCoachInput = {
  coachId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  specialization:
    | "Strength"
    | "Conditioning"
    | "Mobility"
    | "Private Coaching"
    | "Football"
    | "Tennis"
    | "Calisthenics"
    | "Rehab"
    | "Athletic Performance"
    | "General Fitness";
};

type DeleteCoachInput = {
  coachId: string;
  confirmationText: string;
};

function toCoachSpecialization(
  specialization: SaveCoachInput["specialization"]
): CoachSpecialization {
  switch (specialization) {
    case "Conditioning":
      return CoachSpecialization.CONDITIONING;
    case "Mobility":
      return CoachSpecialization.MOBILITY;
    case "Private Coaching":
      return CoachSpecialization.PRIVATE_COACHING;
    case "Football":
      return CoachSpecialization.FOOTBALL;
    case "Tennis":
      return CoachSpecialization.TENNIS;
    case "Calisthenics":
      return CoachSpecialization.CALISTHENICS;
    case "Rehab":
      return CoachSpecialization.REHAB;
    case "Athletic Performance":
      return CoachSpecialization.ATHLETIC_PERFORMANCE;
    case "General Fitness":
      return CoachSpecialization.GENERAL_FITNESS;
    default:
      return CoachSpecialization.STRENGTH;
  }
}

function buildGeneratedCoachPassword(email: string) {
  const localPart = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "") || "coach";
  return `MFS_${localPart.slice(0, 10)}2026`;
}

export async function saveCoach(input: SaveCoachInput) {
  await requireRole(UserRole.ADMIN);
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || "";
  const specialization = toCoachSpecialization(input.specialization);

  if (!fullName) {
    throw new Error("Coach full name is required.");
  }

  if (!email) {
    throw new Error("Coach email is required.");
  }

  const password = input.coachId
    ? ""
    : await bcrypt.hash(buildGeneratedCoachPassword(email), 12);
  const { error } = await getSupabaseServerClient().rpc("save_coach", {
    p_coach_id: input.coachId ?? "",
    p_email: email,
    p_full_name: fullName,
    p_password_hash: password,
    p_phone: phone,
    p_specialization: specialization,
  });
  if (error?.code === "P0002") throw new Error("Coach record not found.");
  if (error?.code === "23505") throw new Error("Another user already uses this email.");
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
}

export async function deleteCoach(input: DeleteCoachInput) {
  await requireRole(UserRole.ADMIN);

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm coach deletion.');
  }

  const { error } = await getSupabaseServerClient().rpc("delete_coach", {
    p_coach_id: input.coachId,
  });
  if (error?.code === "P0002") throw new Error("Coach record not found.");
  if (error?.code === "23503") {
    throw new Error("This coach still has assigned groups or sessions. Reassign or delete those first.");
  }
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/schedule");
}
