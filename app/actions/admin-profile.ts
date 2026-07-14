"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

type SaveAdminProfileInput = {
  fullName: string;
  email: string;
};

export async function saveAdminProfile(input: SaveAdminProfileInput) {
  const user = await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) {
    throw new Error("Admin full name is required.");
  }

  if (!email) {
    throw new Error("Admin email is required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== user.id) {
    throw new Error("Another user already uses this email.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: fullName,
      email,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/profile");
}
