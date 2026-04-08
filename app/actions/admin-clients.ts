"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { getPrisma } from "@/lib/prisma";

type SaveAdminClientInput = {
  clientId?: string | null;
  fullName: string;
  email: string;
  phone?: string;
  status: "Active" | "Pending" | "Paused";
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
};

type DeleteAdminClientInput = {
  clientId: string;
  confirmationText: string;
};

function toClientStatus(
  status: SaveAdminClientInput["status"]
): "ACTIVE" | "PENDING" | "PAUSED" {
  switch (status) {
    case "Active":
      return "ACTIVE";
    case "Paused":
      return "PAUSED";
    default:
      return "PENDING";
  }
}

function toPaymentStatus(
  status: SaveAdminClientInput["paymentStatus"]
): "PAID" | "UNPAID" | "DUE_SOON" {
  switch (status) {
    case "Paid":
      return "PAID";
    case "Due soon":
      return "DUE_SOON";
    default:
      return "UNPAID";
  }
}

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export async function saveAdminClient(input: SaveAdminClientInput) {
  const prisma = getPrisma();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const status = toClientStatus(input.status);
  const paymentStatus = toPaymentStatus(input.paymentStatus);
  const amount = parseAmount(input.paymentAmount);

  if (!fullName) {
    throw new Error("Client full name is required.");
  }

  if (!email) {
    throw new Error("Client email is required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      clientProfile: {
        select: {
          id: true,
        },
      },
    },
  });

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

    if (existingUser && existingUser.id !== client.userId) {
      throw new Error("Another user already uses this email.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: client.userId },
        data: {
          name: fullName,
          email,
        },
      });

      await tx.client.update({
        where: { id: client.id },
        data: {
          fullName,
          phone,
          isPaid: paymentStatus === "PAID",
          paymentStatus,
        },
      });

      await tx.$executeRaw`
        UPDATE "Client"
        SET "status" = ${status}::"ClientLifecycleStatus"
        WHERE "id" = ${client.id}
      `;

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
  } else {
    if (existingUser?.clientProfile) {
      throw new Error("A client with this email already exists.");
    }

    if (existingUser && !existingUser.clientProfile) {
      throw new Error("A user with this email already exists. Use a different email.");
    }

    const password = await bcrypt.hash("password123", 12);
    const clientId = randomUUID();

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: fullName,
          email,
          password,
          role: "CLIENT",
        },
        select: {
          id: true,
        },
      });

      await tx.$executeRaw`
        INSERT INTO "Client" (
          "id",
          "fullName",
          "phone",
          "status",
          "isPaid",
          "paymentStatus",
          "userId",
          "createdAt"
        )
        VALUES (
          ${clientId},
          ${fullName},
          ${phone},
          ${status}::"ClientLifecycleStatus",
          ${paymentStatus === "PAID"},
          ${paymentStatus}::"ClientPaymentStatus",
          ${createdUser.id},
          NOW()
        )
      `;

      if (paymentStatus === "PAID") {
        if (!amount) {
          throw new Error("Enter a valid payment amount before marking the client paid.");
        }

        await tx.payment.create({
          data: {
            amount,
            currency: "EGP",
            note: "Initial payment recorded from the admin client editor.",
            clientId,
          },
        });
      }
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
}

export async function deleteAdminClient(input: DeleteAdminClientInput) {
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
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}
