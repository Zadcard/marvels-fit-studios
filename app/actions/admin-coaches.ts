"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { getPrisma } from "@/lib/prisma";

type SaveCoachInput = {
  coachId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
};

export async function saveCoach(input: SaveCoachInput) {
  const prisma = getPrisma();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;

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
      prisma.coach.update({
        where: { id: existingCoach.id },
        data: {
          fullName,
          phone,
        },
      }),
    ]);
  } else {
    if (existingUser?.coachProfile) {
      throw new Error("A coach with this email already exists.");
    }

    if (existingUser && !existingUser.coachProfile) {
      throw new Error("A user with this email already exists. Use a different email.");
    }

    const password = await bcrypt.hash("password123", 12);

    await prisma.user.create({
      data: {
        name: fullName,
        email,
        password,
        role: "COACH",
        coachProfile: {
          create: {
            fullName,
            phone,
          },
        },
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
}
