"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

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

export async function saveCoach(input: SaveCoachInput) {
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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existingCoach.userId },
        data: {
          name: fullName,
          email,
        },
      }),
    ]);

    await prisma.$executeRaw`
      UPDATE "Coach"
      SET
        "fullName" = ${fullName},
        "phone" = ${phone},
        "specialization" = ${specialization}::"CoachSpecialization"
      WHERE "id" = ${existingCoach.id}
    `;
  } else {
    if (existingUser?.coachProfile) {
      throw new Error("A coach with this email already exists.");
    }

    if (existingUser && !existingUser.coachProfile) {
      throw new Error("A user with this email already exists. Use a different email.");
    }

    const password = await bcrypt.hash("password123", 12);

    const createdUser = await prisma.user.create({
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

    await prisma.$executeRaw`
      INSERT INTO "Coach" (
        "id",
        "fullName",
        "phone",
        "specialization",
        "userId",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${fullName},
        ${phone},
        ${specialization}::"CoachSpecialization",
        ${createdUser.id},
        NOW()
      )
    `;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
}

export async function deleteCoach(input: DeleteCoachInput) {
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
