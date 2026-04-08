"use server";

import { revalidatePath } from "next/cache";

import { getPrisma } from "@/lib/prisma";

type SaveAdminClientInput = {
  clientId: string;
  fullName: string;
  email: string;
  phone?: string;
  status: "Active" | "Pending" | "Paused";
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
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

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
    },
  });

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

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
}
