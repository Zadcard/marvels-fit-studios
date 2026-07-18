import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const vercelConfig = JSON.parse(readFileSync(resolve("vercel.json"), "utf8")) as {
  crons: Array<{ path: string; schedule: string }>;
};
const migration = readFileSync(
  resolve("supabase/migrations/20260718172000_harden_daily_staff_notification_automation.sql"),
  "utf8",
);

describe("studio automation deployment contract", () => {
  it("uses a daily schedule supported by every Vercel plan", () => {
    expect(vercelConfig.crons).toEqual([
      { path: "/api/cron/studio-automation", schedule: "0 3 * * *" },
    ]);
  });

  it("selects reminders by Cairo calendar date instead of an hourly window", () => {
    expect(migration).toMatch(
      /"startsAt" at time zone 'Africa\/Cairo'\)::date[\s\S]*::date \+ 1/,
    );
    expect(migration).toMatch(
      /"renewsAt" at time zone 'Africa\/Cairo'\)::date[\s\S]*::date \+ 7/,
    );
    expect(migration).not.toContain("interval '23 hours'");
  });

  it("targets live staff routes and keeps the automation RPC service-only", () => {
    expect(migration).toContain("/coach/sessions?session=");
    expect(migration).toContain("/admin/schedule");
    expect(migration).toContain("/admin/subscriptions");
    expect(migration).toMatch(/admin_user\."role" = 'ADMIN'/);
    expect(migration).toMatch(
      /revoke all on function public\.run_studio_notification_automation[\s\S]*from public, anon, authenticated/,
    );
  });

  it("records success and caught failure in the AutomationRun ledger", () => {
    expect(migration).toContain("'SUCCEEDED'");
    expect(migration).toContain("'FAILED'");
    expect(migration).toMatch(/exception when others/);
  });
});
