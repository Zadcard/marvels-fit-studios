import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260718163000_transactional_booking_and_group_capacity.sql",
  ),
  "utf8",
);

describe("booking and group capacity transactions", () => {
  it("locks a session before capacity and private replacement decisions", () => {
    expect(migration).toMatch(
      /from public\."TrainingSession" training_session[\s\S]*?for update;/,
    );
    expect(migration).toContain('session_record."type" = \'PRIVATE\'');
    expect(migration).toContain('"status" = \'CANCELED\'');
    expect(migration).toContain('next_status := \'WAITLIST\'::public."BookingStatus"');
    expect(migration).toContain('settings."overbookWaitlist"');
  });

  it("locks group membership before enforcing capacity", () => {
    expect(migration).toContain(
      "create or replace function public.set_admin_group_membership",
    );
    expect(migration).toContain("current_members >= group_capacity");
    expect(migration).toContain("Group is already at capacity.");
  });

  it("refuses to lower group capacity below current membership", () => {
    expect(migration).toContain(
      "Group capacity cannot be lower than current membership.",
    );
    expect(migration).toContain("member_count >");
  });

  it("keeps all new RPCs service-role only", () => {
    expect(migration.match(/from public, anon, authenticated;/g)).toHaveLength(3);
    expect(migration.match(/to service_role;/g)).toHaveLength(3);
  });
});
