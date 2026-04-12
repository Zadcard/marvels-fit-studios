"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type {
  AdminPaymentStatus,
  AdminSubscriptionStatus,
} from "@/lib/mocks/admin-subscriptions";
import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

type SaveAdminSubscriptionInput = {
  subscriptionId?: string | null;
  clientId: string;
  planId: string;
  subscriptionStatus: "Active" | "Pending renewal" | "Paused" | "Trial";
  paymentStatus: AdminPaymentStatus;
  amount: string;
  renewalDate: string;
};

type SubscriptionMutation = "pause" | "resume" | "cancel" | "renew";

function revalidateSubscriptionViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/client");
  revalidatePath("/client/subscription");
}

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
  status: AdminPaymentStatus
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

function toAdminSubscriptionStatus(
  status: "ACTIVE" | "TRIAL" | "PAUSED" | "EXPIRED" | "CANCELED",
  renewsAt: Date | null
): AdminSubscriptionStatus {
  if (status === "TRIAL") {
    return "Trial";
  }

  if (status === "CANCELED") {
    return "Canceled";
  }

  if (status === "PAUSED" || status === "EXPIRED") {
    return "Paused";
  }

  if (renewsAt && renewsAt.getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000) {
    return "Pending renewal";
  }

  return "Active";
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

function getCycleDurationDays(subscription: {
  startsAt: Date;
  renewsAt: Date | null;
  endsAt: Date | null;
  plan: { billingCycle: "MONTHLY" | "WEEKLY" | "CUSTOM" };
}) {
  if (subscription.plan.billingCycle === "WEEKLY") {
    return 7;
  }

  if (subscription.plan.billingCycle === "MONTHLY") {
    return 30;
  }

  const referenceEnd = subscription.renewsAt ?? subscription.endsAt;

  if (!referenceEnd) {
    return 30;
  }

  const diffDays = Math.round(
    (referenceEnd.getTime() - subscription.startsAt.getTime()) / (24 * 60 * 60 * 1000)
  );

  return diffDays > 0 ? diffDays : 30;
}

function getNextRenewalDate(subscription: {
  startsAt: Date;
  renewsAt: Date | null;
  endsAt: Date | null;
  plan: { billingCycle: "MONTHLY" | "WEEKLY" | "CUSTOM" };
}) {
  const days = getCycleDurationDays(subscription);
  const base =
    subscription.renewsAt && subscription.renewsAt.getTime() > Date.now()
      ? subscription.renewsAt
      : new Date();

  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildMutationSuccessMessage(action: SubscriptionMutation) {
  switch (action) {
    case "pause":
      return "Subscription paused.";
    case "resume":
      return "Subscription resumed.";
    case "cancel":
      return "Subscription canceled.";
    case "renew":
      return "Subscription renewed.";
  }
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
        ...(input.subscriptionId ? { NOT: { id: input.subscriptionId } } : {}),
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
            customPrice: amount,
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
            customPrice: amount,
            sessionsTotal: plan.sessionsIncluded,
            isAutoRenew: targetStatus !== "PAUSED",
          },
          select: { id: true },
        });

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

  revalidateSubscriptionViews();

  return result;
}

export async function mutateAdminSubscriptionLifecycle(
  subscriptionId: string,
  action: SubscriptionMutation
) {
  await requireRole(UserRole.ADMIN);
  const prisma = getPrisma();
  const trimmedSubscriptionId = subscriptionId.trim();

  if (!trimmedSubscriptionId) {
    throw new Error("Subscription id is required.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.clientSubscription.findUnique({
      where: { id: trimmedSubscriptionId },
      select: {
        id: true,
        clientId: true,
        startsAt: true,
        renewsAt: true,
        endsAt: true,
        customPrice: true,
        status: true,
        sessionsTotal: true,
        plan: {
          select: {
            price: true,
            currency: true,
            billingCycle: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found.");
    }

    const amount = subscription.customPrice ?? subscription.plan.price;

    if (action === "pause") {
      if (subscription.status === "CANCELED") {
        throw new Error("Canceled subscriptions cannot be paused.");
      }

      if (subscription.status === "PAUSED") {
        throw new Error("This subscription is already paused.");
      }

      const pauseEndsAt = subscription.renewsAt ?? new Date();
      const updated = await tx.clientSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "PAUSED",
          endsAt: pauseEndsAt,
          isAutoRenew: false,
        },
        select: {
          status: true,
          renewsAt: true,
        },
      });

      return {
        subscriptionStatus: toAdminSubscriptionStatus(updated.status, updated.renewsAt),
        paymentStatus: "Manual review" as AdminPaymentStatus,
      };
    }

    if (action === "resume") {
      if (subscription.status === "CANCELED") {
        throw new Error("Canceled subscriptions cannot be resumed.");
      }

      if (subscription.status !== "PAUSED" && subscription.status !== "EXPIRED") {
        throw new Error("Only paused subscriptions can be resumed.");
      }

      const nextRenewal = getNextRenewalDate(subscription);
      const updated = await tx.clientSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          endsAt: null,
          renewsAt: nextRenewal,
          isAutoRenew: true,
        },
        select: {
          status: true,
          renewsAt: true,
        },
      });

      await tx.client.update({
        where: { id: subscription.clientId },
        data: {
          isPaid: false,
          paymentStatus: "DUE_SOON",
        },
      });

      return {
        subscriptionStatus: toAdminSubscriptionStatus(updated.status, updated.renewsAt),
        paymentStatus: "Due soon" as AdminPaymentStatus,
      };
    }

    if (action === "cancel") {
      if (subscription.status === "CANCELED") {
        throw new Error("This subscription is already canceled.");
      }

      const now = new Date();
      const updated = await tx.clientSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELED",
          endsAt: now,
          renewsAt: null,
          isAutoRenew: false,
        },
        select: {
          status: true,
          renewsAt: true,
        },
      });

      await tx.client.update({
        where: { id: subscription.clientId },
        data: {
          isPaid: false,
          paymentStatus: "UNPAID",
        },
      });

      return {
        subscriptionStatus: toAdminSubscriptionStatus(updated.status, updated.renewsAt),
        paymentStatus: "Manual review" as AdminPaymentStatus,
      };
    }

    if (subscription.status === "CANCELED") {
      throw new Error("Canceled subscriptions cannot be renewed.");
    }

    const nextRenewal = getNextRenewalDate(subscription);
    const updated = await tx.clientSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        endsAt: null,
        renewsAt: nextRenewal,
        sessionsUsed: 0,
        sessionsTotal: subscription.sessionsTotal,
        isAutoRenew: true,
      },
      select: {
        status: true,
        renewsAt: true,
      },
    });

    await tx.client.update({
      where: { id: subscription.clientId },
      data: {
        isPaid: true,
        paymentStatus: "PAID",
      },
    });

    await tx.payment.create({
      data: {
        amount,
        currency: subscription.plan.currency,
        note: "Renewed from the admin subscriptions dashboard.",
        date: new Date(),
        clientId: subscription.clientId,
        clientSubscriptionId: subscription.id,
      },
    });

    return {
      subscriptionStatus: toAdminSubscriptionStatus(updated.status, updated.renewsAt),
      paymentStatus: "Paid" as AdminPaymentStatus,
    };
  });

  revalidateSubscriptionViews();

  return {
    ...result,
    message: buildMutationSuccessMessage(action),
  };
}
