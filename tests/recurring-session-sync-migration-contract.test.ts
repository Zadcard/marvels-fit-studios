// tests/recurring-session-sync-migration-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260721091000_recurring_session_slot_generation.sql",
  "utf8",
);

describe("recurring session sync migration", () => {
  it("generates occurrences per slot, keyed by sourceSlotId", () => {
    expect(migration).toContain('for slot_record in');
    expect(migration).toContain('select * from public."RecurringSessionSlot" where "templateId" = p_template_id');
    expect(migration).toContain('"sourceSlotId"');
    expect(migration).toContain('on conflict ("sourceSlotId", "startsAt") where "sourceSlotId" is not null do nothing');
  });

  it("cancels future sessions for removed slots and adds newly requested ones", () => {
    expect(migration).toContain("update public.\"TrainingSession\"");
    expect(migration).toContain("set \"status\" = 'CANCELED'");
    expect(migration).toContain('and "startsAt" > now()');
    expect(migration).toContain('delete from public."RecurringSessionSlot" where "id" = existing_slot."id"');
    expect(migration).toContain('insert into public."RecurringSessionSlot"');
  });

  it("regenerates through the existing horizon after every sync", () => {
    expect(migration).toContain('coalesce(p_through_date, "lastGeneratedThrough", p_starts_on + 28)');
    expect(migration).toContain('perform public.generate_recurring_sessions(v_template_id, v_through);');
  });

  it("restricts execution to the service role", () => {
    expect(migration).toContain(
      "revoke all on function public.sync_recurring_session_template(",
    );
    expect(migration).toContain(
      "grant execute on function public.sync_recurring_session_template(",
    );
    expect(migration).toContain("to service_role;");
  });
});
