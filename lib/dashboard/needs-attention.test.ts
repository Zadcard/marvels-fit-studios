import { describe, expect, it } from "vitest";

import {
  buildNeedsAttentionTiles,
  classifySubscriptionUrgency,
} from "@/lib/dashboard/needs-attention";

const now = new Date("2026-07-15T12:00:00.000Z");

describe("classifySubscriptionUrgency", () => {
  it("treats an open-ended subscription as ok", () => {
    expect(classifySubscriptionUrgency(null, now)).toBe("ok");
  });

  it("flags past end dates as expired", () => {
    expect(
      classifySubscriptionUrgency(new Date("2026-07-14T12:00:00.000Z"), now)
    ).toBe("expired");
  });

  it("flags end dates inside the window as expiring", () => {
    expect(
      classifySubscriptionUrgency(new Date("2026-07-20T12:00:00.000Z"), now)
    ).toBe("expiring");
  });

  it("treats end dates beyond the window as ok", () => {
    expect(
      classifySubscriptionUrgency(new Date("2026-08-15T12:00:00.000Z"), now)
    ).toBe("ok");
  });
});

describe("buildNeedsAttentionTiles", () => {
  it("omits tiles with a zero count", () => {
    const tiles = buildNeedsAttentionTiles({
      expiredSubscriptions: 0,
      expiringSubscriptions: 2,
      trialFollowUps: 0,
      injuryAlertsToday: 1,
    });
    expect(tiles.map((tile) => tile.id)).toEqual([
      "injury-alerts",
      "expiring-subscriptions",
    ]);
  });

  it("returns an empty list when nothing needs attention", () => {
    expect(
      buildNeedsAttentionTiles({
        expiredSubscriptions: 0,
        expiringSubscriptions: 0,
        trialFollowUps: 0,
        injuryAlertsToday: 0,
      })
    ).toEqual([]);
  });

  it("orders safety and money ahead of pipeline", () => {
    const tiles = buildNeedsAttentionTiles({
      expiredSubscriptions: 1,
      expiringSubscriptions: 1,
      trialFollowUps: 1,
      injuryAlertsToday: 1,
    });
    expect(tiles.map((tile) => tile.id)).toEqual([
      "injury-alerts",
      "expired-subscriptions",
      "expiring-subscriptions",
      "trial-follow-ups",
    ]);
  });
});
