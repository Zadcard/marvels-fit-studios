import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260718165000_enforce_session_overlap_and_bulk_atomicity.sql",
  ),
  "utf8",
);

describe("session overlap and bulk atomicity migration", () => {
  it("enforces non-overlapping active coach sessions in PostgreSQL", () => {
    expect(migration).toContain('constraint "TrainingSession_coach_active_time_excl"');
    expect(migration).toContain('tsrange("startsAt", "endsAt", \'[)\') with &&');
    expect(migration).toContain("where (\"status\" in ('DRAFT', 'SCHEDULED'))");
  });

  it("rejects invalid bulk changes before mutating sessions", () => {
    expect(migration).toContain("Selected sessions overlap each other.");
    expect(migration).toContain("Completed sessions cannot be canceled.");
    expect(migration.indexOf("Completed sessions cannot be canceled.")).toBeLessThan(
      migration.indexOf('set "status" = \'CANCELED\''),
    );
    expect(migration).toContain("Capacity cannot be lower than the current active roster.");
  });

  it("updates a roster in one database transaction with service-only grants", () => {
    expect(migration).toContain("create or replace function public.bulk_update_session_attendance");
    expect(migration).toContain("foreach client_id in array p_client_ids loop");
    expect(migration).toContain("from public.update_session_attendance(");
    expect(migration.match(/from public, anon, authenticated;/g)).toHaveLength(2);
    expect(migration.match(/to service_role;/g)).toHaveLength(2);
  });
});
