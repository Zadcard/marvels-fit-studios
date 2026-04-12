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

function mapPaymentStatus(record: {
  status: string;
  renewsAt: Date | null;
  payments: Array<{ date: Date }>;
  client: { isPaid: boolean };
}): AdminPaymentStatus {
  const latestPayment = record.payments[0]?.date ?? null;

  if (record.status === "CANCELED") {
    return "Manual review";
  }

  if (record.status === "PAUSED" || record.status === "EXPIRED") {
    return record.renewsAt && record.renewsAt.getTime() < Date.now()
      ? "Overdue"
      : "Manual review";
  }

  if (latestPayment && record.renewsAt) {
    const activeWindowStart = new Date(record.renewsAt);
    activeWindowStart.setUTCDate(activeWindowStart.getUTCDate() - 45);

    if (latestPayment.getTime() >= activeWindowStart.getTime()) {
      return "Paid";
    }
  }

  if (record.status === "ACTIVE" && record.renewsAt) {
    return record.renewsAt.getTime() < Date.now() ? "Overdue" : "Due soon";
  }

  return record.client.isPaid ? "Paid" : "Manual review";
}

function mapBillingCycleLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export class AdminSubscriptionRepository {
  private prisma = getPrisma();

  private async ensureDefaultPlans() {
    const existingPlanCount = await this.prisma.subscriptionPlan.count();

    if (existingPlanCount > 0) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.subscriptionPlan.create({
        data: {
          name: "Group Membership",
          slug: "group-membership",
          description: "Core recurring plan for coached group training.",
          billingCycle: "MONTHLY",
          sessionsIncluded: 8,
          price: 1850,
          currency: "EGP",
          isActive: true,
        },
      }),
      this.prisma.subscriptionPlan.create({
        data: {
          name: "Private Coaching",
          slug: "private-coaching",
          description: "One-to-one coaching plan with private sessions.",
          billingCycle: "MONTHLY",
          sessionsIncluded: 8,
          price: 4200,
          currency: "EGP",
          isActive: true,
        },
      }),
      this.prisma.subscriptionPlan.create({
        data: {
          name: "Hybrid Elite",
          slug: "hybrid-elite",
          description: "Mix of group and private training support.",
          billingCycle: "MONTHLY",
          sessionsIncluded: 12,
          price: 3400,
          currency: "EGP",
          isActive: true,
        },
      }),
      this.prisma.subscriptionPlan.create({
        data: {
          name: "Starter Reset",
          slug: "starter-reset",
          description: "Short onboarding plan for new clients.",
          billingCycle: "CUSTOM",
          sessionsIncluded: 4,
          price: 950,
          currency: "EGP",
          isActive: true,
        },
      }),
    ]);
  }

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
    clientOptions: Array<{ id: string; label: string }>;
    planOptions: Array<{ id: string; label: string; amountLabel: string }>;
  }> {
    await this.ensureDefaultPlans();

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      subscriptions,
      activePlans,
      renewalsThisWeek,
      collectedThisCycle,
      atRiskAccounts,
      clients,
      plans,
    ] =
      await Promise.all([
        this.prisma.clientSubscription.findMany({
          orderBy: [{ startsAt: "desc" }],
          select: {
            id: true,
            status: true,
            renewsAt: true,
            customPrice: true,
            plan: {
              select: {
                id: true,
                name: true,
                billingCycle: true,
                price: true,
              },
            },
            client: {
              select: {
                id: true,
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
                  where: {
                    status: {
                      in: ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"],
                    },
                    trainingSession: {
                      status: {
                        not: "CANCELED",
                      },
                    },
                  },
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
              take: 5,
              select: {
                id: true,
                amount: true,
                currency: true,
                date: true,
                note: true,
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
        this.prisma.client.findMany({
          orderBy: [{ fullName: "asc" }],
          select: {
            id: true,
            fullName: true,
          },
        }),
        this.prisma.subscriptionPlan.findMany({
          where: { isActive: true },
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
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
        clientId: (subscription as typeof subscription & { client: { id?: string } }).client.id,
        planId: subscription.plan.id,
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
        renewalDateValue: subscription.renewsAt
          ? subscription.renewsAt.toISOString().slice(0, 10)
          : "",
        amountLabel: currencyFormatter.format(
          subscription.customPrice ?? subscription.plan.price
        ),
        amountValue: String(
          subscription.customPrice ?? subscription.plan.price
        ),
        billingCycle: mapBillingCycleLabel(subscription.plan.billingCycle),
        note:
          paymentStatus === "Paid"
            ? "Latest payment is recorded."
            : subscriptionStatus === "Canceled"
              ? "This subscription has been canceled."
              : "Payment follow-up is still needed.",
        paymentHistory: subscription.payments.map((payment) => ({
          id: payment.id,
          amountLabel: new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: payment.currency,
            maximumFractionDigits: 0,
          }).format(payment.amount),
          dateLabel: dateFormatter.format(payment.date),
          note: payment.note ?? "Payment recorded.",
        })),
      } satisfies AdminSubscriptionRecord;
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

    return {
      stats,
      records,
      clientOptions: clients.map((client) => ({
        id: client.id,
        label: client.fullName,
      })),
      planOptions: plans.map((plan) => ({
        id: plan.id,
        label: plan.name,
        amountLabel: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: plan.currency,
          maximumFractionDigits: 0,
        }).format(plan.price),
      })),
    };
  }
}

export const adminSubscriptionRepository = new AdminSubscriptionRepository();
