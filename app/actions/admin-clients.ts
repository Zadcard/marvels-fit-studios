"use server";

import bcrypt from "bcryptjs";
import { ClientLifecycleStatus, ClientPaymentStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";
import { clientIdGenerator } from "@/lib/services/client-id-generator";
import { passwordGenerator } from "@/lib/services/password-generator";
import {
  addClientToScheduleBlock,
  moveClientBetweenScheduleBlocks,
  removeClientFromScheduleBlock,
} from "@/lib/services/schedule-block-service";

type SaveAdminClientInput = {
  clientId?: string | null;
  fullName: string;
  email?: string;
  phone?: string;
  initialPassword?: string;
  status: "Active" | "Pending" | "Paused";
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
  groupId?: string;
  blockId?: string;
};

type DeleteAdminClientInput = {
  clientId: string;
  confirmationText: string;
};

function toClientStatus(
  status: SaveAdminClientInput["status"]
): ClientLifecycleStatus {
  switch (status) {
    case "Active":
      return ClientLifecycleStatus.ACTIVE;
    case "Paused":
      return ClientLifecycleStatus.PAUSED;
    default:
      return ClientLifecycleStatus.PENDING;
  }
}

function toPaymentStatus(
  status: SaveAdminClientInput["paymentStatus"]
): ClientPaymentStatus {
  switch (status) {
    case "Paid":
      return ClientPaymentStatus.PAID;
    case "Due soon":
      return ClientPaymentStatus.DUE_SOON;
    default:
      return ClientPaymentStatus.UNPAID;
  }
}

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function normalizePassword(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeEmail(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function assertValidPassword(password: string, mode: "create" | "reset") {
  if (!password) {
    if (mode === "create") {
      throw new Error("Initial password is required for new clients.");
    }

    return;
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Password must include at least one letter and one number.");
  }
}

async function generateUniqueClientId() {
  const prisma = getPrisma();
  const nextClientNumber = await clientIdGenerator.getNextClientNumber();

  for (let offset = 0; offset < 1000; offset += 1) {
    const candidate = clientIdGenerator.generateId({
      clientNumber: nextClientNumber + offset,
    });
    const existing = await prisma.user.findUnique({
      where: { clientId: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique client ID. Please try again.");
}

export async function saveAdminClient(input: SaveAdminClientInput) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() || null;
  const initialPassword = normalizePassword(input.initialPassword);
  const status = toClientStatus(input.status);
  const paymentStatus = toPaymentStatus(input.paymentStatus);
  const amount = parseAmount(input.paymentAmount);
  const groupId = input.groupId?.trim() || null;
  const targetBlockId = input.blockId?.trim() || null;

  if (!fullName) {
    throw new Error("Client full name is required.");
  }

  const existingUser = email
    ? await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          clientProfile: {
            select: {
              id: true,
            },
          },
        },
      })
    : null;

  let savedClientId = input.clientId ?? null;

  if (input.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: {
        id: true,
        userId: true,
        subscriptions: {
          orderBy: [{ startsAt: "desc" }],
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error("Client not found.");
    }

    if (email && existingUser && existingUser.id !== client.userId) {
      throw new Error("Another user already uses this email.");
    }

    assertValidPassword(initialPassword, "reset");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: client.userId },
        data: {
          name: fullName,
          email,
          ...(initialPassword
            ? { password: await bcrypt.hash(initialPassword, 12) }
            : {}),
        },
      });

      await tx.client.update({
        where: { id: client.id },
        data: {
          fullName,
          phone,
          groupId,
          isPaid: paymentStatus === "PAID",
          paymentStatus,
          status,
        },
      });

      if (paymentStatus === "PAID") {
        if (!amount) {
          throw new Error("Enter a valid payment amount before marking the client paid.");
        }

        await tx.payment.create({
          data: {
            amount,
            currency: "EGP",
            note: "Marked paid from the admin client editor.",
            clientId: client.id,
            clientSubscriptionId: client.subscriptions[0]?.id,
          },
        });
      }
    });

    savedClientId = client.id;
  } else {
    if (email && existingUser?.clientProfile) {
      throw new Error("A client with this email already exists.");
    }

    if (email && existingUser && !existingUser.clientProfile) {
      throw new Error("A user with this email already exists. Use a different email.");
    }

    const generatedClientId = await generateUniqueClientId();
    const resolvedPassword =
      initialPassword || passwordGenerator.generatePassword(generatedClientId);
    assertValidPassword(resolvedPassword, "create");
    const password = await bcrypt.hash(resolvedPassword, 12);

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: fullName,
          clientId: generatedClientId,
          email,
          password,
          role: "CLIENT",
        },
        select: {
          id: true,
        },
      });

      const createdClient = await tx.client.create({
        data: {
          fullName,
          phone,
          groupId,
          status,
          isPaid: paymentStatus === "PAID",
          paymentStatus,
          userId: createdUser.id,
        },
        select: {
          id: true,
        },
      });

      if (paymentStatus === "PAID") {
        if (!amount) {
          throw new Error("Enter a valid payment amount before marking the client paid.");
        }

        await tx.payment.create({
          data: {
            amount,
            currency: "EGP",
            note: "Initial payment recorded from the admin client editor.",
            clientId: createdClient.id,
          },
        });
      }

      savedClientId = createdClient.id;
    });
  }

  if (!savedClientId) {
    throw new Error("Client record could not be resolved after save.");
  }

  const updatedClient = await prisma.client.findUnique({
    where: {
      id: savedClientId,
    },
    select: {
      id: true,
      scheduleBlocks: {
        take: 1,
        select: {
          scheduleBlockId: true,
        },
      },
    },
  });

  if (!updatedClient) {
    throw new Error("Client record could not be resolved after save.");
  }

  const currentBlockId = updatedClient.scheduleBlocks[0]?.scheduleBlockId ?? null;

  if (currentBlockId && !targetBlockId) {
    await removeClientFromScheduleBlock({
      blockId: currentBlockId,
      clientId: updatedClient.id,
    });
  } else if (!currentBlockId && targetBlockId) {
    await addClientToScheduleBlock({
      blockId: targetBlockId,
      clientId: updatedClient.id,
    });
  } else if (
    currentBlockId &&
    targetBlockId &&
    currentBlockId !== targetBlockId
  ) {
    await moveClientBetweenScheduleBlocks({
      fromBlockId: currentBlockId,
      toBlockId: targetBlockId,
      clientId: updatedClient.id,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/blocks");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
}

export async function deleteAdminClient(input: DeleteAdminClientInput) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm client deletion.');
  }

  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
    select: {
      id: true,
      userId: true,
      _count: {
        select: {
          bookings: true,
          payments: true,
          subscriptions: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error("Client not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({
      where: {
        clientId: client.id,
      },
    });

    await tx.file.deleteMany({
      where: {
        clientId: client.id,
      },
    });

    await tx.workoutNote.deleteMany({
      where: {
        clientId: client.id,
      },
    });

    await tx.sessionCompensation.deleteMany({
      where: {
        clientId: client.id,
      },
    });

    await tx.user.delete({
      where: {
        id: client.userId,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}
