// Shared Active/Expiring/Inactive computation for subscription-backed
// dashboards. "Expiring" is 7 days or fewer remaining; "Inactive" covers
// both "never subscribed" and "subscription expired without a renewal".

export type SubscriptionUrgencyStatus = "Active" | "Expiring" | "Inactive";

const EXPIRING_THRESHOLD_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeSubscriptionUrgency(
  subscription: { status: string; renewsAt: Date | null } | null | undefined,
  now: Date = new Date()
): { subscriptionStatus: SubscriptionUrgencyStatus; daysRemaining: number | null } {
  if (!subscription || subscription.status !== "ACTIVE") {
    return { subscriptionStatus: "Inactive", daysRemaining: null };
  }

  if (!subscription.renewsAt) {
    return { subscriptionStatus: "Active", daysRemaining: null };
  }

  const daysRemaining = Math.ceil(
    (subscription.renewsAt.getTime() - now.getTime()) / MS_PER_DAY
  );

  if (daysRemaining <= 0) {
    return { subscriptionStatus: "Inactive", daysRemaining };
  }

  if (daysRemaining <= EXPIRING_THRESHOLD_DAYS) {
    return { subscriptionStatus: "Expiring", daysRemaining };
  }

  return { subscriptionStatus: "Active", daysRemaining };
}

function urgencyRank(status: SubscriptionUrgencyStatus): number {
  return status === "Expiring" ? 0 : status === "Active" ? 1 : 2;
}

// Expiring first (nearest expiry first), then Active, then Inactive last.
export function compareByUrgency(
  a: { subscriptionStatus: SubscriptionUrgencyStatus; subscriptionDaysRemaining: number | null },
  b: { subscriptionStatus: SubscriptionUrgencyStatus; subscriptionDaysRemaining: number | null }
): number {
  const rankDiff = urgencyRank(a.subscriptionStatus) - urgencyRank(b.subscriptionStatus);
  if (rankDiff !== 0) return rankDiff;

  const aDays = a.subscriptionDaysRemaining ?? Number.POSITIVE_INFINITY;
  const bDays = b.subscriptionDaysRemaining ?? Number.POSITIVE_INFINITY;
  return aDays - bDays;
}
