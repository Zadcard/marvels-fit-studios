import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260721090000_recurring_session_slots.sql",
  "utf8",
);

describe("recurring session slots migration", () => {
  it("creates a slot table keyed to the template, one row per weekday/time", () => {
    expect(migration).toContain('create table "RecurringSessionSlot"');
    expect(migration).toContain(
      'references "RecurringSessionTemplate"("id") on delete cascade',
    );
    expect(migration).toContain('unique ("templateId", "weekday", "localStartTime")');
  });

  it("backfills existing templates into slots before dropping the old columns", () => {
    expect(migration.indexOf("insert into \"RecurringSessionSlot\"")).toBeLessThan(
      migration.indexOf('alter table "RecurringSessionTemplate" drop column "weekday"'),
    );
    expect(migration).toContain('alter table "RecurringSessionTemplate" drop column "weekday"');
    expect(migration).toContain(
      'alter table "RecurringSessionTemplate" drop column "localStartTime"',
    );
  });

  it("links sessions to slots and validates occurrence time against the slot, not the template", () => {
    expect(migration).toContain('add column "sourceSlotId" uuid references "RecurringSessionSlot"');
    expect(migration).toContain('"TrainingSession_slot_start_unique_idx"');
    expect(migration).toContain('on "TrainingSession" ("sourceSlotId", "startsAt")');
    expect(migration).toContain('extract(dow from local_start)::integer = slot."weekday"');
    expect(migration).toContain('new."sourceTemplateId" := template."id";');
  });
});
