"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

type SaveAdminSubscriptionInput = {
  subscriptionId?: string | null;
  clientId: string;
  planId: string;
  subscriptionStatus: "Active" | "Pending renewal" | "Paused" | "Trial";
  paymentStatus: "Paid" | "Due soon" | "Overdue" | "Manual review";
  amount: string;
  renewalDate: string;
};

function toSubscriptionStatus(
  status: SaveAdminSubscriptionInput["subscriptionStatus"]
): "ACTIVE" | "TRIAL" | "PAUSED" {
  switch (status) {
    case "Trial":
      return "TRIAL";
    case "Paused":
      return "PAUSED";
    default:
      return "ACTIVE";
  }
}

function toClientPaymentStatus(
  status: SaveAdminSubscriptionInput["paymentStatus"]
): "PAID" | "DUE_SOON" | "UNPAID" {
  switch (status) {
    case "Paid":
      return "PAID";
    case "Due soon":
      return "DUE_SOON";
    default:
      return "UNPAID";
  }
}

function parseAmount(value: string) {
  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function parseRenewalDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function saveAdminSubscription(input: SaveAdminSubscriptionInput) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();
  const clientId = input.clientId.trim();
  const planId = input.planId.trim();
  const amount = parseAmount(input.amount);
  const renewsAt = parseRenewalDate(input.renewalDate);

  if (!clientId) {
    throw new Error("Choose a client.");
  }

  if (!planId) {
    throw new Error("Choose a subscription plan.");
  }

  if (!amount) {
    throw new Error("Enter a valid subscription amount.");
  }

  if (!renewsAt) {
    throw new Error("Enter a valid renewal date.");
  }

  const targetStatus = toSubscriptionStatus(input.subscriptionStatus);
  const clientPaymentStatus = toClientPaymentStatus(input.paymentStatus);
  const isPaid = clientPaymentStatus === "PAID";

  const result = await prisma.$transaction(async (tx) => {
    const existingConflict = await tx.clientSubscription.findFirst({
      where: {
        clientId,
        planId,
        ...(input.subscriptionId
          ? { NOT: { id: input.subscriptionId } }
          : {}),
      },
      select: { id: true },
    });

    if (existingConflict) {
      throw new Error("This client already has that subscription plan.");
    }

    const plan = await tx.subscriptionPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        price: true,
        sessionsIncluded: true,
      },
    });

    if (!plan) {
      throw new Error("Subscription plan not found.");
    }

    const existingSubscription = input.subscriptionId
      ? await tx.clientSubscription.findUnique({
          where: { id: input.subscriptionId },
          select: {
            id: true,
            startsAt: true,
          },
        })
      : null;

    const startsAt = existingSubscription?.startsAt ?? new Date();

    const subscription = existingSubscription
      ? await tx.clientSubscription.update({
          where: { id: existingSubscription.id },
        data: {
          clientId,
          planId,
          status: targetStatus,
          startsAt,
          renewsAt,
          endsAt: targetStatus === "PAUSED" ? renewsAt : null,
          sessionsTotal: plan.sessionsIncluded,
          isAutoRenew: targetStatus !== "PAUSED",
        },
          select: { id: true },
        })
      : await tx.clientSubscription.create({
        data: {
          clientId,
          planId,
          status: targetStatus,
          startsAt,
          renewsAt,
          endsAt: targetStatus === "PAUSED" ? renewsAt : null,
          sessionsTotal: plan.sessionsIncluded,
          isAutoRenew: targetStatus !== "PAUSED",
        },
        select: { id: true },
      });

    await tx.$executeRaw`
      UPDATE "ClientSubscription"
      SET "customPrice" = ${amount}
      WHERE "id" = ${subscription.id}
    `;

    await tx.client.update({
      where: { id: clientId },
      data: {
        isPaid,
        paymentStatus: clientPaymentStatus,
      },
    });

    if (isPaid) {
      const existingPayments = await tx.payment.findMany({
        where: {
          clientSubscriptionId: subscription.id,
        },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
        },
      });

      if (existingPayments[0]) {
        await tx.payment.update({
          where: { id: existingPayments[0].id },
          data: {
            amount,
            currency: "EGP",
            note: "Updated from the admin subscriptions dashboard.",
            date: new Date(),
          },
        });

        if (existingPayments.length > 1) {
          await tx.payment.deleteMany({
            where: {
              id: {
                in: existingPayments.slice(1).map((payment) => payment.id),
              },
            },
          });
        }
      } else {
        await tx.payment.create({
          data: {
            amount,
            currency: "EGP",
            note: existingSubscription
              ? "Updated from the admin subscriptions dashboard."
              : "Created from the admin subscriptions dashboard.",
            date: new Date(),
            clientId,
            clientSubscriptionId: subscription.id,
          },
        });
      }
    }
    return {
      id: subscription.id,
      clientId,
      planId,
      renewsAt: renewsAt.toISOString(),
      amount,
      paymentStatus: input.paymentStatus,
      subscriptionStatus: input.subscriptionStatus,
    };
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/client/subscription");

  return result;
}
