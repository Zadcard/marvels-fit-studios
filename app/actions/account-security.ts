"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

type ChangeOwnPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function validateNewPassword(password: string) {
  if (password.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("New password must include at least one letter and one number.");
  }
}

export async function changeOwnPassword(input: ChangeOwnPasswordInput) {
  const user = await requireUser();
  const prisma = getPrisma();
  const currentPassword = input.currentPassword.trim();
  const newPassword = input.newPassword.trim();
  const confirmPassword = input.confirmPassword.trim();

  if (!currentPassword) {
    throw new Error("Current password is required.");
  }

  validateNewPassword(newPassword);

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirmation do not match.");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from the current password.");
  }

  const persistedUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      password: true,
    },
  });

  if (!persistedUser?.password) {
    throw new Error("This account does not have a password set.");
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    persistedUser.password
  );

  if (!currentPasswordMatches) {
    throw new Error("Current password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
    },
  });

  revalidatePath("/admin/profile");
  revalidatePath("/coach/settings");
  revalidatePath("/client/settings");
}
