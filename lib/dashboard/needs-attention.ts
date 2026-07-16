// Needs Attention: the practical, action-first panel for the admin Today view.
// Every tile answers "what needs a decision now?" and links to the page where
// the admin acts on it. Pure helpers here are unit-tested; the repository feeds
// them real counts.

export type NeedsAttentionTone = "danger" | "warning" | "neutral";

export type NeedsAttentionTile = {
  id: string;
  label: string;
  count: number;
  description: string;
  href: string;
  tone: NeedsAttentionTone;
};

export type NeedsAttentionInput = {
  expiredSubscriptions: number;
  expiringSubscriptions: number;
  trialFollowUps: number;
  injuryAlertsToday: number;
};

export type SubscriptionUrgency = "expired" | "expiring" | "ok";

/**
 * Classifies a subscription by its end date relative to now. "expiring" means
 * it ends within `windowDays` (inclusive); already-past end dates are "expired".
 * A null end date (open-ended) is always "ok".
 */
export function classifySubscriptionUrgency(
  endsAt: Date | null,
  now: Date,
  windowDays = 7
): SubscriptionUrgency {
  if (!endsAt) {
    return "ok";
  }

  if (endsAt.getTime() < now.getTime()) {
    return "expired";
  }

  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  if (endsAt.getTime() - now.getTime() <= windowMs) {
    return "expiring";
  }

  return "ok";
}

/**
 * Builds the Needs Attention tiles from aggregated counts. Tiles with a zero
 * count are omitted so the panel only shows real, actionable work. Order is
 * fixed by operational priority (safety first, then money, then pipeline).
 */
export function buildNeedsAttentionTiles(
  input: NeedsAttentionInput
): NeedsAttentionTile[] {
  const tiles: NeedsAttentionTile[] = [
    {
      id: "injury-alerts",
      label: "Injury alerts today",
      count: input.injuryAlertsToday,
      description: "Clients training today with a current injury or in rehab.",
      href: "/admin/schedule",
      tone: "danger",
    },
    {
      id: "expired-subscriptions",
      label: "Expired subscriptions",
      count: input.expiredSubscriptions,
      description: "Active clients whose subscription has already lapsed.",
      href: "/admin/subscriptions",
      tone: "danger",
    },
    {
      id: "expiring-subscriptions",
      label: "Expiring soon",
      count: input.expiringSubscriptions,
      description: "Subscriptions ending within the next 7 days.",
      href: "/admin/subscriptions",
      tone: "warning",
    },
    {
      id: "trial-follow-ups",
      label: "Trials to follow up",
      count: input.trialFollowUps,
      description: "Trial clients still waiting on an outcome decision.",
      href: "/admin/clients",
      tone: "warning",
    },
  ];

  return tiles.filter((tile) => tile.count > 0);
}
