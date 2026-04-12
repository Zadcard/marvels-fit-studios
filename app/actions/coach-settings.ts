"use server";

import { CoachSpecialization, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

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
  const prisma = getPrisma();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim() || null;
  const specialization = toCoachSpecialization(input.specialization);

  if (!fullName) {
    throw new Error("Coach full name is required.");
  }

  if (!email) {
    throw new Error("Coach email is required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== user.id) {
    throw new Error("Another user already uses this email.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: fullName,
        email,
      },
    });

    const coachProfile = await tx.coach.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!coachProfile) {
      throw new Error("Coach profile not found.");
    }

    await tx.coach.update({
      where: { id: coachProfile.id },
      data: {
        fullName,
        phone,
        specialization,
      },
    });
  });

  revalidatePath("/coach");
  revalidatePath("/coach/settings");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/sessions");
}
