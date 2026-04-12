"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

type SaveClientPaymentInput = {
  clientId: string;
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
};

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export async function saveClientPaymentStatus(input: SaveClientPaymentInput) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
    select: {
      id: true,
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

  if (input.paymentStatus === "Paid") {
    const amount = parseAmount(input.paymentAmount);

    if (!amount) {
      throw new Error("Enter a valid payment amount before marking the client paid.");
    }

    await prisma.$transaction([
      prisma.client.update({
        where: { id: client.id },
        data: {
          isPaid: true,
          paymentStatus: "PAID",
        },
      }),
      prisma.payment.create({
        data: {
          amount,
          currency: "EGP",
          note: "Marked paid from the admin dashboard.",
          clientId: client.id,
          clientSubscriptionId: client.subscriptions[0]?.id,
        },
      }),
    ]);
  } else {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        isPaid: false,
        paymentStatus: input.paymentStatus === "Due soon" ? "DUE_SOON" : "UNPAID",
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
}
