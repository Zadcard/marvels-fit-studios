import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const todayRepository = readFileSync(
  "lib/repositories/admin-today-operations-repository.ts",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20260718174000_unify_client_subscription_lifecycle.sql",
  "utf8",
);

describe("trial and subscription source of truth", () => {
  it("uses completed lead trials for the Today lead workflow", () => {
    expect(todayRepository).toMatch(
      /\.from\("Lead"\)[\s\S]*\.eq\("status", "TRIAL_DONE"\)/,
    );
    expect(todayRepository).not.toMatch(
      /\.from\("Client"\)[\s\S]{0,160}\.eq\("status", "TRIAL"\)/,
    );
  });

  it("synchronizes subscription lifecycle changes into the client roster", () => {
    expect(migration).toMatch(/ClientSubscription_sync_client_lifecycle/);
    expect(migration).toMatch(/current_subscription_status = 'ACTIVE'/);
    expect(migration).toMatch(/status = 'ACTIVE'/);
    expect(migration).toMatch(/"trialOutcome"[\s\S]*'SUBSCRIBED'/);
    expect(migration).toMatch(/current_subscription_status = 'TRIAL'/);
    expect(migration).toMatch(/current_subscription_status = 'PAUSED'/);
    expect(migration).toMatch(/set status = 'INACTIVE'/);
  });
});
