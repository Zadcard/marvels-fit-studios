"use server";

import bcrypt from "bcryptjs";
import { CoachSpecialization, UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

type SaveCoachInput = {
  coachId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  specialization: "Strength" | "Conditioning" | "Mobility" | "Private Coaching";
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
  const prisma = getPrisma();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const specialization = toCoachSpecialization(input.specialization);

  if (!fullName) {
    throw new Error("Coach full name is required.");
  }

  if (!email) {
    throw new Error("Coach email is required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      coachProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (input.coachId) {
    const existingCoach = await prisma.coach.findUnique({
      where: { id: input.coachId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!existingCoach) {
      throw new Error("Coach record not found.");
    }

    if (existingUser && existingUser.id !== existingCoach.userId) {
      throw new Error("Another user already uses this email.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingCoach.userId },
        data: {
          name: fullName,
          email,
        },
      });

      await tx.coach.update({
        where: { id: existingCoach.id },
        data: {
          fullName,
          phone,
          specialization,
        },
      });
    });
  } else {
    if (existingUser?.coachProfile) {
      throw new Error("A coach with this email already exists.");
    }

    if (existingUser && !existingUser.coachProfile) {
      throw new Error("A user with this email already exists. Use a different email.");
    }

    const password = await bcrypt.hash(buildGeneratedCoachPassword(email), 12);

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: fullName,
          email,
          password,
          role: "COACH",
        },
        select: {
          id: true,
        },
      });

      await tx.coach.create({
        data: {
          fullName,
          phone,
          specialization,
          userId: createdUser.id,
        },
      });
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
}

export async function deleteCoach(input: DeleteCoachInput) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm coach deletion.');
  }

  const coach = await prisma.coach.findUnique({
    where: { id: input.coachId },
    select: {
      id: true,
      userId: true,
      _count: {
        select: {
          groups: true,
          trainingSessions: true,
        },
      },
    },
  });

  if (!coach) {
    throw new Error("Coach record not found.");
  }

  if (coach._count.groups > 0 || coach._count.trainingSessions > 0) {
    throw new Error(
      "This coach still has assigned groups or sessions. Reassign or delete those first."
    );
  }

  await prisma.user.delete({
    where: {
      id: coach.userId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/schedule");
}
