import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260718175000_enforce_cairo_recurring_time_contract.sql",
  "utf8",
);
const scheduleWorkspace = readFileSync(
  "components/dashboard/admin-schedule-workspace.tsx",
  "utf8",
);

describe("recurring Cairo time contract", () => {
  it("stores session instants as timestamptz and validates template links", () => {
    expect(migration).toMatch(/alter column "startsAt" type timestamptz/);
    expect(migration).toMatch(/TrainingSession_validate_template_time/);
    expect(migration).toMatch(/"isTemplateException" boolean not null default false/);
    expect(migration).toMatch(/at time zone template\.timezone/);
  });

  it("converts datetime-local inputs through the studio timezone helper", () => {
    expect(scheduleWorkspace).toContain("studioDateTimeLocalToIso(form.startsAt)");
    expect(scheduleWorkspace).toContain("instantToStudioDateTimeLocal");
    expect(scheduleWorkspace).not.toContain("new Date(form.startsAt).toISOString()");
  });
});
