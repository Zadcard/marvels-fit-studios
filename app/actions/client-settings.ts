"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import type { ClientSettingsRecord } from "@/lib/dashboard/client-dashboard-data";
import { getPrisma } from "@/lib/prisma";

function normalizeSettings(input: ClientSettingsRecord): ClientSettingsRecord {
  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    goalLabel: input.goalLabel.trim(),
    preferredSessionTime: input.preferredSessionTime.trim(),
  };
}

export async function saveClientSettings(input: ClientSettingsRecord) {
  const user = await requireRole(UserRole.CLIENT);
  const prisma = getPrisma();
  const settings = normalizeSettings(input);

  if (!settings.fullName) {
    throw new Error("Client full name is required.");
  }

  if (!settings.email) {
    throw new Error("Client email is required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: settings.email },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== user.id) {
    throw new Error("Another user already uses this email.");
  }

  const client = await prisma.client.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!client) {
    throw new Error("Client profile not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: settings.fullName,
        email: settings.email,
      },
    });

    await tx.client.update({
      where: { id: client.id },
      data: {
        fullName: settings.fullName,
        phone: settings.phone || null,
      },
    });

    await tx.clientPreferences.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        goalLabel:
          settings.goalLabel ||
          "Build steady strength and improve movement confidence.",
        preferredSessionTime: settings.preferredSessionTime || "Flexible",
      },
      update: {
        goalLabel:
          settings.goalLabel ||
          "Build steady strength and improve movement confidence.",
        preferredSessionTime: settings.preferredSessionTime || "Flexible",
      },
    });
  });

  revalidatePath("/client");
  revalidatePath("/client/settings");
  revalidatePath("/client/sessions");
  revalidatePath("/client/coach");
}
