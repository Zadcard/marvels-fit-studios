import "server-only";

import type {
  AdminPaymentStatus,
  AdminPlanType,
  AdminSubscriptionRecord,
  AdminSubscriptionStatus,
} from "@/lib/mocks/admin-subscriptions";
import { getPrisma } from "@/lib/prisma";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function mapPlanName(record: {
  plan: { name: string };
  client: {
    bookings: Array<{ trainingSession: { type: "GROUP" | "PRIVATE" } }>;
  };
}): AdminPlanType {
  const normalized = record.plan.name.toLowerCase();
  const hasPrivate = record.client.bookings.some(
    (booking) => booking.trainingSession.type === "PRIVATE"
  );
  const hasGroup = record.client.bookings.some(
    (booking) => booking.trainingSession.type === "GROUP"
  );

  if (normalized.includes("starter")) {
    return "Starter Reset";
  }

  if (hasPrivate && hasGroup) {
    return "Hybrid Elite";
  }

  if (normalized.includes("private") || hasPrivate) {
    return "Private Coaching";
  }

  return "Group Membership";
}

function mapSubscriptionStatus(status: string, renewsAt: Date | null): AdminSubscriptionStatus {
  if (status === "TRIAL") {
    return "Trial";
  }

  if (status === "PAUSED" || status === "EXPIRED" || status === "CANCELED") {
    return "Paused";
  }

  if (renewsAt && renewsAt.getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000) {
    return "Pending renewal";
  }

  return "Active";
}

function mapPaymentStatus(record: {
  status: string;
  renewsAt: Date | null;
  payments: Array<{ date: Date }>;
  client: { isPaid: boolean };
}): AdminPaymentStatus {
  if (record.payments.length > 0) {
    return "Paid";
  }

  if (record.status === "ACTIVE" && record.renewsAt) {
    return record.renewsAt.getTime() < Date.now() ? "Overdue" : "Due soon";
  }

  return record.client.isPaid ? "Paid" : "Manual review";
}

export class AdminSubscriptionRepository {
  private prisma = getPrisma();

  async list(): Promise<{
    stats: Array<{
      id: string;
      label: string;
      value: string;
      change: string;
      detail: string;
      note: string;
      iconKey: "shield-check" | "refresh-ccw" | "circle-dollar-sign" | "badge-dollar-sign";
      tone: "accent" | "success" | "warning" | "neutral";
    }>;
    records: AdminSubscriptionRecord[];
  }> {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [subscriptions, activePlans, renewalsThisWeek, collectedThisCycle, atRiskAccounts] =
      await Promise.all([
        this.prisma.clientSubscription.findMany({
          orderBy: [{ startsAt: "desc" }],
          select: {
            id: true,
            status: true,
            renewsAt: true,
            plan: {
              select: {
                name: true,
                billingCycle: true,
                price: true,
              },
            },
            client: {
              select: {
                fullName: true,
                isPaid: true,
                group: {
                  select: {
                    coach: {
                      select: {
                        fullName: true,
                      },
                    },
                  },
                },
                bookings: {
                  select: {
                    trainingSession: {
                      select: {
                        type: true,
                        coach: {
                          select: {
                            fullName: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            payments: {
              orderBy: [{ date: "desc" }],
              take: 1,
              select: {
                date: true,
              },
            },
          },
        }),
        this.prisma.clientSubscription.count({
          where: { status: "ACTIVE" },
        }),
        this.prisma.clientSubscription.count({
          where: {
            renewsAt: {
              gte: now,
              lte: in7Days,
            },
          },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            date: { gte: startOfMonth },
          },
        }),
        this.prisma.clientSubscription.count({
          where: {
            OR: [
              {
                renewsAt: {
                  lt: now,
                },
                payments: {
                  none: {},
                },
              },
              {
                status: {
                  in: ["PAUSED", "EXPIRED", "CANCELED"],
                },
              },
            ],
          },
        }),
      ]);

    const records = subscriptions.map((subscription) => {
      const planName = mapPlanName(subscription);
      const subscriptionStatus = mapSubscriptionStatus(
        subscription.status,
        subscription.renewsAt
      );
      const paymentStatus = mapPaymentStatus(subscription);

      return {
        id: subscription.id,
        memberName: subscription.client.fullName,
        planName,
        subscriptionStatus,
        paymentStatus,
        assignedCoach:
          subscription.client.group?.coach.fullName ??
          subscription.client.bookings[0]?.trainingSession.coach.fullName ??
          "Unassigned",
        renewalDate: subscription.renewsAt
          ? dateFormatter.format(subscription.renewsAt)
          : "No renewal set",
        amountLabel: currencyFormatter.format(subscription.plan.price),
        billingCycle:
          subscription.plan.billingCycle.charAt(0) +
          subscription.plan.billingCycle.slice(1).toLowerCase(),
        note:
          paymentStatus === "Paid"
            ? "Latest payment is recorded."
            : "Payment follow-up is still needed.",
      };
    });

    const stats: Array<{
      id: string;
      label: string;
      value: string;
      change: string;
      detail: string;
      note: string;
      iconKey: "shield-check" | "refresh-ccw" | "circle-dollar-sign" | "badge-dollar-sign";
      tone: "accent" | "success" | "warning" | "neutral";
    }> = [
      {
        id: "active-plans",
        label: "Active plans",
        value: `${activePlans}`,
        change: `${records.filter((record) => record.subscriptionStatus === "Trial").length} trial accounts`,
        detail: "Live client subscriptions in the database.",
        note: "Database-backed",
        iconKey: "shield-check" as const,
        tone: "accent",
      },
      {
        id: "renewals",
        label: "Renewals this week",
        value: `${renewalsThisWeek}`,
        change: `${records.filter((record) => record.paymentStatus === "Due soon").length} due soon`,
        detail: "Subscriptions approaching renewal in the next seven days.",
        note: "Database-backed",
        iconKey: "refresh-ccw" as const,
        tone: renewalsThisWeek > 0 ? "warning" : "neutral",
      },
      {
        id: "collected",
        label: "Collected this cycle",
        value: currencyFormatter.format(collectedThisCycle._sum.amount ?? 0),
        change: "Current month",
        detail: "Payments recorded since the start of the month.",
        note: "Database-backed",
        iconKey: "circle-dollar-sign" as const,
        tone: "success",
      },
      {
        id: "at-risk",
        label: "At-risk accounts",
        value: `${atRiskAccounts}`,
        change: `${records.filter((record) => record.paymentStatus === "Overdue").length} overdue`,
        detail: "Accounts needing renewal or payment attention.",
        note: "Database-backed",
        iconKey: "badge-dollar-sign" as const,
        tone: atRiskAccounts > 0 ? "warning" : "neutral",
      },
    ];

    return { stats, records };
  }
}

export const adminSubscriptionRepository = new AdminSubscriptionRepository();
