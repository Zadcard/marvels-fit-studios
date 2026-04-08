"use server";

import { UserRole } from "@prisma/client";
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
): "STRENGTH" | "CONDITIONING" | "MOBILITY" | "PRIVATE_COACHING" {
  switch (specialization) {
    case "Conditioning":
      return "CONDITIONING";
    case "Mobility":
      return "MOBILITY";
    case "Private Coaching":
      return "PRIVATE_COACHING";
    default:
      return "STRENGTH";
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

    await tx.$executeRaw`
      UPDATE "Coach"
      SET
        "fullName" = ${fullName},
        "phone" = ${phone},
        "specialization" = ${specialization}::"CoachSpecialization"
      WHERE "id" = ${coachProfile.id}
    `;
  });

  revalidatePath("/coach");
  revalidatePath("/coach/settings");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/sessions");
}
