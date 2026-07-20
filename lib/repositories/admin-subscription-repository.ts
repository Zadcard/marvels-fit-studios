import "server-only";

import type {
  AdminPaymentMethod,
  AdminPaymentStatus,
  AdminPlanType,
  AdminSubscriptionRecord,
  AdminSubscriptionStatus,
} from "@/lib/mocks/admin-subscriptions";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    (booking) => booking.trainingSession.type === "PRIVATE",
  );
  const hasGroup = record.client.bookings.some(
    (booking) => booking.trainingSession.type === "GROUP",
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

function mapSubscriptionStatus(
  status: string,
  renewsAt: Date | null,
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

function mapPaymentStatus(record: {
  status: string;
  renewsAt: Date | null;
  payments: Array<{ amount: number; date: Date }>;
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

// Sort urgency: Pending renewal (expiring soonest first), then Active, then
// everything else (Trial/Paused/Canceled) last.
function subscriptionUrgencyRank(status: AdminSubscriptionStatus): number {
  if (status === "Pending renewal") return 0;
  if (status === "Active") return 1;
  return 2;
}

function mapBillingCycleLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function mapPaymentMethod(value: string | null): AdminPaymentMethod | undefined {
  switch (value) {
    case "INSTA_PAY":
      return "InstaPay";
    case "VISA":
      return "Visa";
    case "CASH":
      return "Cash";
    default:
      return undefined;
  }
}

export class AdminSubscriptionRepository {
  async list(): Promise<{
    stats: Array<{
      id: string;
      label: string;
      value: string;
      change: string;
      detail: string;
      note: string;
      iconKey:
        | "shield-check"
        | "refresh-ccw"
        | "circle-dollar-sign"
        | "badge-dollar-sign";
      tone: "accent" | "success" | "warning" | "neutral";
    }>;
    records: AdminSubscriptionRecord[];
    clientOptions: Array<{ id: string; label: string }>;
    planOptions: Array<{ id: string; label: string; amountLabel: string }>;
  }> {
    return withSupabaseFallback(
      async () => {
        const supabase = getSupabaseServerClient();
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Self-heals quarterly session windows on every read (cheap no-op
        // when nothing is due) instead of relying on a cron job.
        await supabase.rpc("reconcile_subscription_session_windows");

        const [
          subscriptionsResult,
          clientsResult,
          plansResult,
          paymentsResult,
          ledgerEntriesResult,
        ] = await Promise.all([
          supabase
            .from("ClientSubscription")
            .select(
              `
              id, status, renewsAt, customPrice, startsAt, sessionsTotal,
              plan:SubscriptionPlan(id, name, billingCycle, price),
              client:Client(id, fullName, isPaid, sessionsLeft,
                group:Group(coach:Coach(fullName)),
                bookings:SessionBooking(status,
                  trainingSession:TrainingSession(type, status,
                    coach:Coach(fullName)))),
              payments:Payment(id, amount, currency, date, method, note)
            `,
            )
            .order("startsAt", { ascending: false }),
          supabase.from("Client").select("id, fullName").order("fullName"),
          supabase
            .from("SubscriptionPlan")
            .select("id, name, price, currency")
            .eq("isActive", true)
            .order("name"),
          supabase.from("Payment").select("amount, date"),
          supabase
            .from("BillingLedgerEntry")
            .select("id,paymentId")
            .not("paymentId", "is", null),
        ]);
        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (clientsResult.error) throw clientsResult.error;
        if (plansResult.error) throw plansResult.error;
        if (paymentsResult.error) throw paymentsResult.error;
        if (ledgerEntriesResult.error) throw ledgerEntriesResult.error;

        const receiptIdByPaymentId = new Map(
          ledgerEntriesResult.data.flatMap((entry) =>
            entry.paymentId ? [[entry.paymentId, entry.id] as const] : [],
          ),
        );

        const clients = clientsResult.data;
        const plans = plansResult.data;
        const subscriptions = subscriptionsResult.data.map((subscription) => ({
          ...subscription,
          renewsAt: subscription.renewsAt
            ? new Date(subscription.renewsAt)
            : null,
          client: {
            ...subscription.client,
            bookings: subscription.client.bookings.filter(
              (booking) =>
                ["BOOKED", "ATTENDED", "MISSED", "WAITLIST"].includes(
                  booking.status,
                ) && booking.trainingSession.status !== "CANCELED",
            ),
          },
          payments: subscription.payments
            .sort((left, right) => right.date.localeCompare(left.date))
            .slice(0, 5)
            .map((payment) => ({ ...payment, date: new Date(payment.date) })),
        }));
        // Renewals create a new subscription row per period (history preserved
        // in the database). The operational table shows only the current period
        // per client+plan; `subscriptions` is already ordered startsAt desc, so
        // the first row seen for each key is the most recent one.
        const latestByClientPlan = new Map<string, (typeof subscriptions)[number]>();
        for (const subscription of subscriptions) {
          const key = `${subscription.client.id}:${subscription.plan.id}`;
          if (!latestByClientPlan.has(key)) {
            latestByClientPlan.set(key, subscription);
          }
        }
        const currentSubscriptions = [...latestByClientPlan.values()];
        const activePlans = currentSubscriptions.filter(
          (subscription) => subscription.status === "ACTIVE",
        ).length;
        const renewalsThisWeek = currentSubscriptions.filter(
          (subscription) =>
            subscription.renewsAt &&
            subscription.renewsAt >= now &&
            subscription.renewsAt <= in7Days,
        ).length;
        const collectedThisCycle = paymentsResult.data
          .filter((payment) => new Date(payment.date) >= startOfMonth)
          .reduce((sum, payment) => sum + payment.amount, 0);
        const atRiskAccounts = currentSubscriptions.filter(
          (subscription) =>
            ["PAUSED", "EXPIRED", "CANCELED"].includes(subscription.status) ||
            (!!subscription.renewsAt &&
              subscription.renewsAt < now &&
              subscription.payments.length === 0),
        ).length;

        const records = currentSubscriptions.map((subscription) => {
          const planName = mapPlanName(subscription);
          const subscriptionStatus = mapSubscriptionStatus(
            subscription.status,
            subscription.renewsAt,
          );
          const paymentStatus = mapPaymentStatus(subscription);
          const effectiveAmount =
            subscription.customPrice ?? subscription.plan.price;

          return {
            id: subscription.id,
            clientId: subscription.client.id,
            planId: subscription.plan.id,
            memberName: subscription.client.fullName,
            planName,
            subscriptionStatus,
            paymentStatus,
            assignedCoach:
              subscription.client.group?.coach.fullName ??
                subscription.client.bookings[0]?.trainingSession.coach
                  .fullName ??
                "Unassigned",
            renewalDate: subscription.renewsAt
              ? dateFormatter.format(subscription.renewsAt)
              : "No renewal set",
            renewalDateValue: subscription.renewsAt
              ? subscription.renewsAt.toISOString().slice(0, 10)
              : "",
            amountLabel: currencyFormatter.format(effectiveAmount),
            amountValue: String(effectiveAmount),
            billingCycle: mapBillingCycleLabel(subscription.plan.billingCycle),
            sessionsLeft: subscription.client.sessionsLeft,
            sessionsTotal: subscription.sessionsTotal ?? undefined,
            note:
              paymentStatus === "Paid"
                ? "Latest payment is recorded."
                : subscriptionStatus === "Canceled"
                  ? "This subscription has been canceled."
                  : "Payment follow-up is still needed.",
            paymentHistory: subscription.payments.map((payment) => ({
              id: payment.id,
              receiptId: receiptIdByPaymentId.get(payment.id),
              method: mapPaymentMethod(payment.method),
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

        // Expiring (Pending renewal) first, nearest renewal date first; then
        // Active; everything else last.
        records.sort((a, b) => {
          const rankDiff =
            subscriptionUrgencyRank(a.subscriptionStatus) -
            subscriptionUrgencyRank(b.subscriptionStatus);
          if (rankDiff !== 0) return rankDiff;
          const aDate = a.renewalDateValue || "9999-99-99";
          const bDate = b.renewalDateValue || "9999-99-99";
          return aDate.localeCompare(bDate);
        });

        const stats: Array<{
          id: string;
          label: string;
          value: string;
          change: string;
          detail: string;
          note: string;
          iconKey:
            | "shield-check"
            | "refresh-ccw"
            | "circle-dollar-sign"
            | "badge-dollar-sign";
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
            value: currencyFormatter.format(collectedThisCycle),
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
      },
      {
        stats: [],
        records: [],
        clientOptions: [],
        planOptions: [],
      },
    );
  }
}

export const adminSubscriptionRepository = new AdminSubscriptionRepository();
