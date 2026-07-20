# Multi-Slot Recurring Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let one recurring series hold multiple weekday/time slots (e.g. Sun 8am, Tue 9am, Thu 10am), and let a group's series be created and edited directly from the group form, staying in sync with the Schedule page's series manager.

**Architecture:** Move `weekday`/`localStartTime` out of `RecurringSessionTemplate` into a new child table `RecurringSessionSlot` (one row per day/time). `TrainingSession` gains `sourceSlotId` alongside its existing `sourceTemplateId`. A new Postgres function `sync_recurring_session_template` upserts the template, diffs the requested slot list against existing slots (cancelling future sessions for removed/changed slots, inserting new slot rows), and regenerates occurrences through the series' existing horizon — all in one call, so both the group form and the schedule-page series manager can save through the same server action. A shared React component (`SeriesSlotsEditor`) renders the day/time row list in both places.

**Tech Stack:** Next.js App Router, Supabase Postgres (plpgsql RPCs), Zod validators, Vitest (source-content "contract" tests + real unit tests — this repo has no live-DB test harness, so SQL changes are verified by asserting on migration file contents, matching the existing pattern in `tests/recurring-time-contract.test.ts`).

## Global Constraints

- All series/slot mutations stay behind `requireRole(UserRole.ADMIN)` (existing pattern in `app/actions/admin-recurring-sessions.ts` and `app/actions/admin-groups.ts`).
- Every server action that touches series/slots must call `revalidatePath("/admin/groups")`, `revalidatePath("/admin/schedule")`, and `revalidatePath("/coach/schedule")` (existing `revalidateRecurringViews` / `revalidateGroupViews` helpers) — required by `tests/revalidate-path-contract.test.ts`.
- A series must always have at least 1 slot and at most 7 (one per weekday), with no duplicate `(weekday, localStartTime)` pairs.
- Duration is one value per series (not per slot) — confirmed non-goal.
- All slots in a series share the series' `startsOn`/`endsOn`, coach, title, type, and group link.
- Follow existing code style: these components/actions are dense, minimally-commented, single-purpose files (see `admin-recurring-session-manager.tsx`, `admin-groups.ts`) — match that density rather than introducing heavy abstraction.

---

### Task 1: Migration — `RecurringSessionSlot` table and `TrainingSession.sourceSlotId`

**Files:**
- Create: `supabase/migrations/20260721090000_recurring_session_slots.sql`
- Test: `tests/recurring-session-slots-migration-contract.test.ts`

**Interfaces:**
- Produces: table `"RecurringSessionSlot"` with columns `id, templateId, weekday, localStartTime, createdAt, updatedAt`; column `"TrainingSession"."sourceSlotId"` (uuid, nullable, FK to `RecurringSessionSlot.id` on delete set null).

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260721090000_recurring_session_slots.sql

-- A recurring series (RecurringSessionTemplate) can now repeat on more than
-- one weekday/time (e.g. Sun 8am, Tue 9am, Thu 10am). Move the single
-- weekday/localStartTime pair out into a child table, one row per slot.

create table "RecurringSessionSlot" (
  "id" uuid primary key default gen_random_uuid(),
  "templateId" uuid not null references "RecurringSessionTemplate"("id") on delete cascade,
  "weekday" integer not null check ("weekday" between 0 and 6),
  "localStartTime" time not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("templateId", "weekday", "localStartTime")
);

create index "RecurringSessionSlot_templateId_idx" on "RecurringSessionSlot" ("templateId");

create trigger "RecurringSessionSlot_set_updated_at"
before update on "RecurringSessionSlot"
for each row execute function public.set_updated_at();

alter table "RecurringSessionSlot" enable row level security;
revoke all on table "RecurringSessionSlot" from anon, authenticated;
grant all on table "RecurringSessionSlot" to service_role;

-- Backfill: one slot per existing template, from its current weekday/time.
insert into "RecurringSessionSlot" ("templateId", "weekday", "localStartTime")
select "id", "weekday", "localStartTime" from "RecurringSessionTemplate";

-- Link sessions to the slot that would have generated them.
alter table "TrainingSession"
  add column "sourceSlotId" uuid references "RecurringSessionSlot"("id") on delete set null;

update "TrainingSession" session_record
set "sourceSlotId" = slot."id"
from "RecurringSessionSlot" slot
where slot."templateId" = session_record."sourceTemplateId"
  and session_record."sourceTemplateId" is not null;

-- Replace the template-keyed uniqueness/validation with slot-keyed versions:
-- a template can now have several slots, each with its own weekday/time.
drop index if exists "TrainingSession_template_start_unique_idx";
create unique index "TrainingSession_slot_start_unique_idx"
  on "TrainingSession" ("sourceSlotId", "startsAt")
  where "sourceSlotId" is not null;

create or replace function public.validate_training_session_template_time()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  slot public."RecurringSessionSlot"%rowtype;
  template public."RecurringSessionTemplate"%rowtype;
  local_start timestamp;
  matches_template boolean;
begin
  if new."sourceSlotId" is null then
    new."isTemplateException" := false;
    return new;
  end if;

  select * into slot
  from public."RecurringSessionSlot"
  where id = new."sourceSlotId";
  if not found then
    raise exception 'Recurring session slot not found.' using errcode = 'P0002';
  end if;

  select * into template
  from public."RecurringSessionTemplate"
  where id = slot."templateId";
  if not found then
    raise exception 'Recurring session template not found.' using errcode = 'P0002';
  end if;

  new."sourceTemplateId" := template."id";

  local_start := new."startsAt" at time zone template.timezone;
  matches_template :=
    extract(dow from local_start)::integer = slot."weekday"
    and local_start::time(0) = slot."localStartTime"::time(0);

  if tg_op = 'INSERT'
     or old."sourceSlotId" is distinct from new."sourceSlotId" then
    if not matches_template then
      raise exception 'Linked occurrence does not match the recurring template day and time.'
        using errcode = '23514';
    end if;
    new."isTemplateException" := false;
  else
    new."isTemplateException" := not matches_template;
  end if;

  return new;
end;
$$;

drop trigger if exists "TrainingSession_validate_template_time" on "TrainingSession";
create trigger "TrainingSession_validate_template_time"
before insert or update of "sourceSlotId", "startsAt"
on "TrainingSession"
for each row
execute function public.validate_training_session_template_time();

revoke all on function public.validate_training_session_template_time()
  from public, anon, authenticated;

-- The old single weekday/time columns on the template are superseded by
-- RecurringSessionSlot. Drop them now that every template has a slot row.
alter table "RecurringSessionTemplate" drop column "weekday";
alter table "RecurringSessionTemplate" drop column "localStartTime";
```

- [ ] **Step 2: Write the contract test asserting the migration's shape**

```ts
// tests/recurring-session-slots-migration-contract.test.ts
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
    expect(migration).toContain('on ("sourceSlotId", "startsAt")');
    expect(migration).toContain('extract(dow from local_start)::integer = slot."weekday"');
    expect(migration).toContain('new."sourceTemplateId" := template."id";');
  });
});
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx vitest run tests/recurring-session-slots-migration-contract.test.ts`
Expected: PASS (3 tests) — this test only reads the file you just wrote, so it should pass immediately; if it fails, the SQL text doesn't match exactly what the test asserts.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260721090000_recurring_session_slots.sql tests/recurring-session-slots-migration-contract.test.ts
git commit -m "Add RecurringSessionSlot table for multi-slot recurring series"
```

---

### Task 2: Migration — rewrite generation RPC and add `sync_recurring_session_template`

**Files:**
- Create: `supabase/migrations/20260721091000_recurring_session_slot_generation.sql`
- Test: `tests/recurring-session-sync-migration-contract.test.ts`

**Interfaces:**
- Consumes: `RecurringSessionSlot` table from Task 1.
- Produces: rewritten `public.generate_recurring_sessions(uuid, date) returns integer` (loops per slot); new `public.sync_recurring_session_template(uuid, text, text, "TrainingSessionType", text, text, integer, integer, date, date, jsonb, text, date) returns uuid`.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260721091000_recurring_session_slot_generation.sql

-- generate_recurring_sessions now walks every slot on the template instead
-- of a single weekday/time.
create or replace function public.generate_recurring_sessions(
  p_template_id uuid,
  p_through_date date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  template public."RecurringSessionTemplate"%rowtype;
  slot_record public."RecurringSessionSlot"%rowtype;
  occurrence_date date;
  occurrence_start timestamptz;
  generated_count integer := 0;
begin
  select * into template
  from public."RecurringSessionTemplate"
  where "id" = p_template_id
  for update;

  if not found then
    raise exception 'Recurring session template not found.' using errcode = 'P0002';
  end if;
  if not template."active" then
    raise exception 'Recurring session template is inactive.' using errcode = '22023';
  end if;
  if p_through_date < template."startsOn" then
    raise exception 'Generation date is before the template start date.' using errcode = '22023';
  end if;

  for slot_record in
    select * from public."RecurringSessionSlot" where "templateId" = p_template_id
  loop
    for occurrence_date in
      select day::date
      from generate_series(
        template."startsOn"::timestamp,
        least(p_through_date, coalesce(template."endsOn", p_through_date))::timestamp,
        interval '1 day'
      ) day
      where extract(dow from day)::integer = slot_record."weekday"
    loop
      occurrence_start := (occurrence_date + slot_record."localStartTime") at time zone template."timezone";

      insert into public."TrainingSession" (
        "title", "description", "type", "status", "startsAt", "endsAt",
        "capacity", "coachId", "groupId", "createdById", "sourceTemplateId", "sourceSlotId"
      ) values (
        template."title", template."description", template."type", template."status",
        occurrence_start, occurrence_start + make_interval(mins => template."durationMinutes"),
        template."capacity", template."coachId", template."groupId",
        template."createdById", template."id", slot_record."id"
      )
      on conflict ("sourceSlotId", "startsAt") where "sourceSlotId" is not null do nothing;

      if found then generated_count := generated_count + 1; end if;
    end loop;
  end loop;

  update public."RecurringSessionTemplate"
  set "lastGeneratedThrough" = greatest(coalesce("lastGeneratedThrough", p_through_date), p_through_date)
  where "id" = p_template_id;

  return generated_count;
end;
$$;

-- sync_recurring_session_template upserts the series, diffs the requested
-- slot list against what's stored, cancels future sessions for slots that
-- were removed or changed, adds slots that are new, and regenerates
-- occurrences through the series' existing horizon (or 28 days out for a
-- brand-new series) so the calendar reflects the edit immediately.
create or replace function public.sync_recurring_session_template(
  p_template_id uuid,
  p_title text,
  p_description text,
  p_type "TrainingSessionType",
  p_coach_id text,
  p_group_id text,
  p_capacity integer,
  p_duration_minutes integer,
  p_starts_on date,
  p_ends_on date,
  p_slots jsonb,
  p_created_by_id text,
  p_through_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_template_id uuid;
  v_through date;
  requested_slot record;
  existing_slot public."RecurringSessionSlot"%rowtype;
begin
  if p_template_id is null then
    insert into public."RecurringSessionTemplate" (
      "title", "description", "type", "coachId", "groupId", "capacity",
      "durationMinutes", "startsOn", "endsOn", "createdById"
    ) values (
      p_title, p_description, p_type, p_coach_id, p_group_id, p_capacity,
      p_duration_minutes, p_starts_on, p_ends_on, p_created_by_id
    )
    returning "id" into v_template_id;
  else
    update public."RecurringSessionTemplate"
    set "title" = p_title,
        "description" = p_description,
        "type" = p_type,
        "coachId" = p_coach_id,
        "groupId" = p_group_id,
        "capacity" = p_capacity,
        "durationMinutes" = p_duration_minutes,
        "startsOn" = p_starts_on,
        "endsOn" = p_ends_on
    where "id" = p_template_id
    returning "id" into v_template_id;

    if v_template_id is null then
      raise exception 'Recurring session template not found.' using errcode = 'P0002';
    end if;
  end if;

  -- Remove slots that are no longer requested: cancel their future scheduled
  -- sessions, then delete the slot row.
  for existing_slot in
    select slot.* from public."RecurringSessionSlot" slot
    where slot."templateId" = v_template_id
      and not exists (
        select 1 from jsonb_to_recordset(p_slots) as requested(weekday integer, "localStartTime" time)
        where requested.weekday = slot."weekday"
          and requested."localStartTime" = slot."localStartTime"
      )
  loop
    update public."TrainingSession"
    set "status" = 'CANCELED'
    where "sourceSlotId" = existing_slot."id"
      and "status" = 'SCHEDULED'
      and "startsAt" > now();

    delete from public."RecurringSessionSlot" where "id" = existing_slot."id";
  end loop;

  -- Add slots that are requested but don't exist yet.
  for requested_slot in
    select * from jsonb_to_recordset(p_slots) as requested(weekday integer, "localStartTime" time)
  loop
    insert into public."RecurringSessionSlot" ("templateId", "weekday", "localStartTime")
    values (v_template_id, requested_slot.weekday, requested_slot."localStartTime")
    on conflict ("templateId", "weekday", "localStartTime") do nothing;
  end loop;

  select greatest(
    coalesce(p_through_date, "lastGeneratedThrough", p_starts_on + 28),
    p_starts_on
  )
  into v_through
  from public."RecurringSessionTemplate"
  where "id" = v_template_id;

  perform public.generate_recurring_sessions(v_template_id, v_through);

  return v_template_id;
end;
$$;

revoke all on function public.sync_recurring_session_template(
  uuid, text, text, "TrainingSessionType", text, text, integer, integer, date, date, jsonb, text, date
) from public, anon, authenticated;
grant execute on function public.sync_recurring_session_template(
  uuid, text, text, "TrainingSessionType", text, text, integer, integer, date, date, jsonb, text, date
) to service_role;
```

- [ ] **Step 2: Write the contract test**

```ts
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
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx vitest run tests/recurring-session-sync-migration-contract.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260721091000_recurring_session_slot_generation.sql tests/recurring-session-sync-migration-contract.test.ts
git commit -m "Add sync_recurring_session_template RPC and per-slot generation"
```

---

### Task 3: Validators — multi-slot schema

**Files:**
- Modify: `lib/validators/recurring-session.ts`
- Modify: `lib/validators/recurring-session.test.ts`

**Interfaces:**
- Produces: `recurringSessionSlotSchema` (`{ weekday, localStartTime }`), updated `recurringSessionTemplateSchema` (no `weekday`/`localStartTime`, adds `durationMinutes` — unchanged — and `slots: RecurringSessionSlotInput[]`), exported type `RecurringSessionSlotInput`, updated `RecurringSessionTemplateInput`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/validators/recurring-session.test.ts
import { describe, expect, it } from "vitest";
import { recurringSessionTemplateSchema } from "@/lib/validators/recurring-session";

const validTemplate = {
  title: "Monday strength",
  description: "Weekly group session",
  type: "GROUP" as const,
  coachId: "coach-1",
  groupId: "group-1",
  durationMinutes: 60,
  startsOn: "2026-07-20",
  endsOn: "2026-09-20",
  slots: [
    { weekday: 0, localStartTime: "08:00" },
    { weekday: 2, localStartTime: "09:00" },
    { weekday: 4, localStartTime: "10:00" },
  ],
};

describe("recurringSessionTemplateSchema", () => {
  it("accepts a bounded weekly template with multiple slots", () => {
    expect(recurringSessionTemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  it("accepts a private template", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      type: "PRIVATE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      endsOn: "2026-07-19",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty slot list", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      slots: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 7 slots", () => {
    const slots = Array.from({ length: 8 }, (_, index) => ({
      weekday: index % 7,
      localStartTime: "08:00",
    }));
    const result = recurringSessionTemplateSchema.safeParse({ ...validTemplate, slots });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate weekday/time pairs", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      slots: [
        { weekday: 1, localStartTime: "18:00" },
        { weekday: 1, localStartTime: "18:00" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/validators/recurring-session.test.ts`
Expected: FAIL — `slots` isn't accepted/validated yet, and the old schema still requires top-level `weekday`/`localStartTime` (missing from the new fixture).

- [ ] **Step 3: Write the implementation**

```ts
// lib/validators/recurring-session.ts
import { TrainingSessionType } from "@/lib/supabase/domain";
import { z } from "zod";

export const recurringSessionSlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  localStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const recurringSessionTemplateSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    type: z.nativeEnum(TrainingSessionType),
    coachId: z.string().trim().min(1),
    groupId: z.string().trim().optional(),
    durationMinutes: z.number().int().min(15).max(480),
    startsOn: z.string().date(),
    endsOn: z.string().date().optional(),
    slots: z.array(recurringSessionSlotSchema).min(1).max(7),
  })
  .superRefine((value, context) => {
    if (value.endsOn && value.endsOn < value.startsOn) {
      context.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "End date must be on or after the start date.",
      });
    }
    const seen = new Set<string>();
    value.slots.forEach((slot, index) => {
      const key = `${slot.weekday}:${slot.localStartTime}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["slots", index],
          message: "Each day and time can only appear once in a series.",
        });
      }
      seen.add(key);
    });
  });

export const generateRecurringSessionsSchema = z.object({
  templateId: z.string().uuid(),
  throughDate: z.string().date(),
});

export const recurringSessionTemplateIdSchema = z.string().uuid();

export type RecurringSessionSlotInput = z.infer<typeof recurringSessionSlotSchema>;
export type RecurringSessionTemplateInput = z.infer<
  typeof recurringSessionTemplateSchema
>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/validators/recurring-session.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/validators/recurring-session.ts lib/validators/recurring-session.test.ts
git commit -m "Add multi-slot validation to the recurring series schema"
```

---

### Task 4: Repository and type — `RecurringSessionTemplateRecord.slots`

**Files:**
- Modify: `lib/dashboard/recurring-session-template.ts`
- Modify: `lib/repositories/recurring-session-repository.ts`

**Interfaces:**
- Consumes: Supabase table `RecurringSessionSlot` (Task 1).
- Produces: `RecurringSessionTemplateRecord` with `slots: { weekday: number; localStartTime: string }[]` replacing top-level `weekday`/`localStartTime`; `RecurringSessionRepository.list()` unchanged signature.

- [ ] **Step 1: Update the record type**

```ts
// lib/dashboard/recurring-session-template.ts
export type RecurringSessionTemplateSlot = {
  weekday: number;
  localStartTime: string;
};

export type RecurringSessionTemplateRecord = {
  id: string;
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  coachId: string;
  coachName: string;
  groupId: string | null;
  groupName: string;
  slots: RecurringSessionTemplateSlot[];
  durationMinutes: number;
  startsOn: string;
  endsOn: string;
  active: boolean;
  lastGeneratedThrough: string | null;
};
```

- [ ] **Step 2: Update the repository query**

```ts
// lib/repositories/recurring-session-repository.ts
import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RecurringSessionTemplateRecord } from "@/lib/dashboard/recurring-session-template";

export class RecurringSessionRepository {
  async list() {
    const supabase = getSupabaseServerClient();
    const [templates, coaches, groups] = await Promise.all([
      supabase
        .from("RecurringSessionTemplate")
        .select(
          "*, coach:Coach(fullName), group:Group(name), slots:RecurringSessionSlot(weekday, localStartTime)",
        )
        .order("createdAt", { ascending: false }),
      supabase.from("Coach").select("id, fullName").order("fullName"),
      supabase.from("Group").select("id, name").order("name"),
    ]);
    if (templates.error) throw templates.error;
    if (coaches.error) throw coaches.error;
    if (groups.error) throw groups.error;
    const records: RecurringSessionTemplateRecord[] = templates.data.map(
      (template) => ({
        id: template.id,
        title: template.title,
        description: template.description ?? "",
        type: template.type,
        coachId: template.coachId,
        coachName: template.coach.fullName,
        groupId: template.groupId,
        groupName: template.group?.name ?? "No linked group",
        slots: template.slots
          .map((slot) => ({
            weekday: slot.weekday,
            localStartTime: slot.localStartTime.slice(0, 5),
          }))
          .sort((left, right) => left.weekday - right.weekday),
        durationMinutes: template.durationMinutes,
        startsOn: template.startsOn,
        endsOn: template.endsOn ?? "",
        active: template.active,
        lastGeneratedThrough: template.lastGeneratedThrough,
      }),
    );
    return { templates: records, coaches: coaches.data, groups: groups.data };
  }
}

export const recurringSessionRepository = new RecurringSessionRepository();
```

- [ ] **Step 3: Regenerate Supabase types**

Run: `npx supabase gen types typescript --local > lib/supabase/database.types.ts` (or the project's existing type-gen command — check `package.json` for a `db:types` script first and prefer that if present).
Expected: `database.types.ts` now includes `RecurringSessionSlot` and no longer has `weekday`/`localStartTime` on `RecurringSessionTemplate`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors from these two files. (Other files referencing the old `weekday`/`localStartTime` fields will still error — those are fixed in later tasks.)

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard/recurring-session-template.ts lib/repositories/recurring-session-repository.ts lib/supabase/database.types.ts
git commit -m "Load recurring series slots in the repository layer"
```

---

### Task 5: Server action — `saveRecurringSessionTemplate` calls the sync RPC

**Files:**
- Modify: `app/actions/admin-recurring-sessions.ts`
- Modify: `tests/recurring-session-management-contract.test.ts`

**Interfaces:**
- Consumes: `recurringSessionTemplateSchema` (Task 3), RPC `sync_recurring_session_template` (Task 2).
- Produces: `saveRecurringSessionTemplate(input: RecurringSessionTemplateInput & { templateId?: string | null }): Promise<{ id: string }>` (same external signature as before; internals changed).

- [ ] **Step 1: Update the contract test's expectations**

```ts
// tests/recurring-session-management-contract.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const actions = read("app/actions/admin-recurring-sessions.ts");
const manager = read("components/dashboard/admin-recurring-session-manager.tsx");
const migration = read(
  "supabase/migrations/20260718162000_guard_recurring_template_deletion.sql",
);

describe("recurring session management", () => {
  it("keeps every series mutation behind the admin role guard", () => {
    expect(actions.match(/requireRole\(UserRole\.ADMIN\)/g)).toHaveLength(4);
    expect(actions).toContain("saveRecurringSessionTemplate");
    expect(actions).toContain("deleteRecurringSessionTemplate");
  });

  it("saves through the multi-slot sync RPC", () => {
    expect(actions).toContain('rpc("sync_recurring_session_template"');
    expect(actions).toContain("p_slots:");
  });

  it("exposes edit, generation, activation, and deletion in the live manager", () => {
    expect(manager).toContain("saveRecurringSessionTemplate");
    expect(manager).toContain("generateRecurringSessions");
    expect(manager).toContain("setRecurringTemplateActive");
    expect(manager).toContain("deleteRecurringSessionTemplate");
  });

  it("blocks deletion after occurrences have been generated", () => {
    expect(migration).toContain('session_record."sourceTemplateId" = p_template_id');
    expect(migration).toContain("Recurring template has generated occurrences.");
    expect(migration).toContain(
      "revoke all on function public.delete_recurring_session_template(uuid)",
    );
    expect(migration).toContain("to service_role;");
  });
});
```

Note: the assertion on `"Existing occurrences were not changed."` is removed from this test — that message becomes inaccurate once saving auto-syncs future occurrences (Task 6 replaces the copy in the manager).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/recurring-session-management-contract.test.ts`
Expected: FAIL on the new "saves through the multi-slot sync RPC" test.

- [ ] **Step 3: Update the server action**

```ts
// app/actions/admin-recurring-sessions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateRecurringSessionsSchema,
  recurringSessionTemplateIdSchema,
  recurringSessionTemplateSchema,
  type RecurringSessionTemplateInput,
} from "@/lib/validators/recurring-session";

function revalidateRecurringViews() {
  revalidatePath("/admin/groups");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/schedule");
}

export async function saveRecurringSessionTemplate(
  input: RecurringSessionTemplateInput & { templateId?: string | null },
) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = recurringSessionTemplateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid template.");

  const value = parsed.data;
  const templateId = input.templateId
    ? recurringSessionTemplateIdSchema.parse(input.templateId)
    : null;

  const { data, error } = await getSupabaseServerClient().rpc(
    "sync_recurring_session_template",
    {
      p_template_id: templateId,
      p_title: value.title,
      p_description: value.description || null,
      p_type: value.type,
      p_coach_id: value.coachId,
      p_group_id: value.groupId || null,
      p_capacity: value.type === "PRIVATE" ? 1 : null,
      p_duration_minutes: value.durationMinutes,
      p_starts_on: value.startsOn,
      p_ends_on: value.endsOn || null,
      p_slots: value.slots,
      p_created_by_id: user.id,
      p_through_date: null,
    },
  );
  if (error) {
    if (error.code === "23P01") {
      throw new Error(
        "One or more generated sessions overlap another active session for this coach.",
      );
    }
    throw error;
  }
  revalidateRecurringViews();
  return { id: data as string };
}

export async function generateRecurringSessions(input: {
  templateId: string;
  throughDate: string;
}) {
  await requireRole(UserRole.ADMIN);
  const parsed = generateRecurringSessionsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid date.");
  const { data, error } = await getSupabaseServerClient().rpc(
    "generate_recurring_sessions",
    { p_template_id: parsed.data.templateId, p_through_date: parsed.data.throughDate },
  );
  if (error) {
    if (error.code === "23P01") {
      throw new Error(
        "One or more generated sessions overlap another active session for this coach.",
      );
    }
    throw new Error("Recurring sessions could not be generated.");
  }
  revalidateRecurringViews();
  return { generated: data };
}

export async function setRecurringTemplateActive(templateId: string, active: boolean) {
  await requireRole(UserRole.ADMIN);
  const parsedId = recurringSessionTemplateIdSchema.safeParse(templateId);
  if (!parsedId.success) throw new Error("Invalid template id.");
  const { error } = await getSupabaseServerClient()
    .from("RecurringSessionTemplate")
    .update({ active })
    .eq("id", parsedId.data);
  if (error) throw new Error("The recurring series could not be updated.");
  revalidateRecurringViews();
}

export async function deleteRecurringSessionTemplate(templateId: string) {
  await requireRole(UserRole.ADMIN);
  const parsedId = recurringSessionTemplateIdSchema.safeParse(templateId);
  if (!parsedId.success) throw new Error("Invalid template id.");
  const { error } = await getSupabaseServerClient().rpc(
    "delete_recurring_session_template",
    { p_template_id: parsedId.data },
  );
  if (error) {
    if (error.message.includes("generated occurrences")) {
      throw new Error(
        "This series already has generated occurrences. Pause it instead of deleting it.",
      );
    }
    throw error;
  }
  revalidateRecurringViews();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/recurring-session-management-contract.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin-recurring-sessions.ts tests/recurring-session-management-contract.test.ts
git commit -m "Save recurring series through the multi-slot sync RPC"
```

---

### Task 6: Shared UI — `SeriesSlotsEditor` component

**Files:**
- Create: `components/dashboard/series-slots-editor.tsx`
- Create: `components/dashboard/series-slots-editor.module.css`
- Test: `tests/series-slots-editor-contract.test.ts`

**Interfaces:**
- Produces: `SeriesSlotsEditor` React component, props `{ slots: RecurringSessionTemplateSlot[]; onChange: (slots: RecurringSessionTemplateSlot[]) => void }`, exported `type SlotDraft = RecurringSessionTemplateSlot`.
- Consumes: `RecurringSessionTemplateSlot` from `lib/dashboard/recurring-session-template.ts` (Task 4).

- [ ] **Step 1: Write the component**

```tsx
// components/dashboard/series-slots-editor.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";
import styles from "./series-slots-editor.module.css";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function nextDefaultSlot(existing: RecurringSessionTemplateSlot[]): RecurringSessionTemplateSlot {
  const usedWeekdays = new Set(existing.map((slot) => slot.weekday));
  const weekday = [1, 2, 3, 4, 5, 0, 6].find((day) => !usedWeekdays.has(day)) ?? 1;
  return { weekday, localStartTime: "18:00" };
}

export function SeriesSlotsEditor({
  slots,
  onChange,
}: {
  slots: RecurringSessionTemplateSlot[];
  onChange: (slots: RecurringSessionTemplateSlot[]) => void;
}) {
  function updateSlot(index: number, patch: Partial<RecurringSessionTemplateSlot>) {
    onChange(slots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    if (slots.length >= 7) return;
    onChange([...slots, nextDefaultSlot(slots)]);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, slotIndex) => slotIndex !== index));
  }

  return (
    <div className={styles.editor}>
      {slots.map((slot, index) => (
        <div className={styles.row} key={index}>
          <select
            value={slot.weekday}
            onChange={(event) => updateSlot(index, { weekday: Number(event.target.value) })}
          >
            {weekdays.map((day, dayIndex) => (
              <option key={day} value={dayIndex}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            required
            value={slot.localStartTime}
            onChange={(event) => updateSlot(index, { localStartTime: event.target.value })}
          />
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => removeSlot(index)}
            disabled={slots.length <= 1}
            aria-label="Remove day"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={addSlot} disabled={slots.length >= 7}>
        <Plus size={14} /> Add day
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write the CSS module**

```css
/* components/dashboard/series-slots-editor.module.css */
.editor{display:grid;gap:8px}
.row{display:grid;grid-template-columns:1fr 120px 34px;gap:8px;align-items:center}
.row select,.row input{min-height:38px;padding:0 9px;border:1px solid #36363a;border-radius:9px;background:#0a0a0b;color:#fff;font-size:.74rem}
.removeButton{min-height:38px;display:grid;place-items:center;border:1px solid #36363a;border-radius:9px;background:#171719;color:#ff565b}
.removeButton:disabled{opacity:.35}
.addButton{display:inline-flex;align-items:center;gap:6px;justify-self:start;padding:8px 11px;border:1px dashed #3a3a3e;border-radius:9px;background:transparent;color:#ff565b;font-size:.7rem;font-weight:700}
.addButton:disabled{opacity:.35}
```

- [ ] **Step 3: Write the contract test**

```ts
// tests/series-slots-editor-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const editor = readFileSync("components/dashboard/series-slots-editor.tsx", "utf8");

describe("series slots editor", () => {
  it("caps slots at 7 and never allows removing the last one", () => {
    expect(editor).toContain("slots.length >= 7");
    expect(editor).toContain("disabled={slots.length <= 1}");
  });

  it("is exported for reuse in both the group form and the schedule manager", () => {
    expect(editor).toContain("export function SeriesSlotsEditor");
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/series-slots-editor-contract.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/series-slots-editor.tsx components/dashboard/series-slots-editor.module.css tests/series-slots-editor-contract.test.ts
git commit -m "Add shared multi-slot day/time editor component"
```

---

### Task 7: Schedule page — wire `SeriesSlotsEditor` into the recurring series manager

**Files:**
- Modify: `components/dashboard/admin-recurring-session-manager.tsx`
- Modify: `tests/recurring-session-management-contract.test.ts`
- Modify: `tests/recurring-time-contract.test.ts` (only if it references removed fields — check before editing)

**Interfaces:**
- Consumes: `SeriesSlotsEditor` (Task 6), `RecurringSessionTemplateRecord` with `slots`/`durationMinutes` (Task 4), `saveRecurringSessionTemplate` (Task 5).

- [ ] **Step 1: Update the contract test**

Add to `tests/recurring-session-management-contract.test.ts` (inside the existing `describe` block, alongside the manager assertions from Task 5):

```ts
  it("lets one series manage multiple weekday/time slots", () => {
    expect(manager).toContain("SeriesSlotsEditor");
    expect(manager).toContain("slots:");
    expect(manager).not.toContain('weekday: form.weekday');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/recurring-session-management-contract.test.ts`
Expected: FAIL on the new test — the manager still has single-slot form state.

- [ ] **Step 3: Rewrite the manager's form state and JSX**

Replace the `FormState` type, `weekdays` usage in the list/card summary, `emptyForm`/`formFor`, and the weekday/time fields in the form with slot-array equivalents:

```tsx
// components/dashboard/admin-recurring-session-manager.tsx
"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarRange, Pause, Play, Plus, Repeat2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";

import {
  deleteRecurringSessionTemplate,
  generateRecurringSessions,
  saveRecurringSessionTemplate,
  setRecurringTemplateActive,
} from "@/app/actions/admin-recurring-sessions";
import type {
  RecurringSessionTemplateRecord,
  RecurringSessionTemplateSlot,
} from "@/lib/dashboard/recurring-session-template";
import type {
  AdminScheduleGroupOption,
} from "@/lib/repositories/admin-schedule-repository";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";
import { addStudioDays, getStudioDateKey } from "@/lib/time/studio-time";
import { SeriesSlotsEditor } from "./series-slots-editor";
import styles from "./admin-recurring-session-manager.module.css";

type FormState = {
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  coachId: string;
  groupId: string;
  slots: RecurringSessionTemplateSlot[];
  durationMinutes: string;
  startsOn: string;
  endsOn: string;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function emptyForm(coachId = "", defaultDurationMinutes = 60): FormState {
  return {
    title: "",
    description: "",
    type: "GROUP",
    coachId,
    groupId: "",
    slots: [{ weekday: 1, localStartTime: "18:00" }],
    durationMinutes: String(defaultDurationMinutes),
    startsOn: getStudioDateKey(),
    endsOn: "",
  };
}

function formFor(template: RecurringSessionTemplateRecord): FormState {
  return {
    title: template.title,
    description: template.description,
    type: template.type,
    coachId: template.coachId,
    groupId: template.groupId ?? "",
    slots: template.slots,
    durationMinutes: String(template.durationMinutes),
    startsOn: template.startsOn,
    endsOn: template.endsOn,
  };
}

function summarizeSlots(slots: RecurringSessionTemplateSlot[]) {
  return slots
    .slice()
    .sort((left, right) => left.weekday - right.weekday)
    .map((slot) => `${weekdays[slot.weekday].slice(0, 3)} ${slot.localStartTime}`)
    .join(" · ");
}

function defaultThroughDate() {
  return addStudioDays(getStudioDateKey(), 28);
}

export function AdminRecurringSessionManager({
  templates,
  coachOptions,
  groupOptions,
  defaultDurationMinutes = 60,
}: {
  templates: RecurringSessionTemplateRecord[];
  coachOptions: AdminSessionCoachOption[];
  groupOptions: AdminScheduleGroupOption[];
  defaultDurationMinutes?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const selected = templates.find((template) => template.id === selectedId) ?? null;
  const [form, setForm] = useState<FormState>(() =>
    selected ? formFor(selected) : emptyForm(coachOptions[0]?.id, defaultDurationMinutes),
  );
  const [throughDate, setThroughDate] = useState(defaultThroughDate);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function choose(template: RecurringSessionTemplateRecord) {
    setSelectedId(template.id);
    setForm(formFor(template));
    setMessage("");
  }

  function createNew() {
    setSelectedId(null);
    setForm(emptyForm(coachOptions[0]?.id, defaultDurationMinutes));
    setMessage("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveRecurringSessionTemplate({
          templateId: selectedId,
          title: form.title,
          description: form.description,
          type: form.type,
          coachId: form.coachId,
          groupId: form.groupId || undefined,
          slots: form.slots,
          durationMinutes: Number(form.durationMinutes),
          startsOn: form.startsOn,
          endsOn: form.endsOn || undefined,
        });
        setSelectedId(result.id);
        setMessage(selectedId ? "Series updated — upcoming sessions were synced." : "Recurring series created.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not save the recurring series.");
      }
    });
  }

  function toggleActive() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      try {
        await setRecurringTemplateActive(selected.id, !selected.active);
        setMessage(selected.active ? "Series paused." : "Series resumed.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not update the series.");
      }
    });
  }

  function generate() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await generateRecurringSessions({ templateId: selected.id, throughDate });
        setMessage(`${result.generated} new occurrence${result.generated === 1 ? "" : "s"} generated.`);
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not generate occurrences.");
      }
    });
  }

  function remove() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      try {
        await deleteRecurringSessionTemplate(selected.id);
        setSelectedId(null);
        setForm(emptyForm(coachOptions[0]?.id, defaultDurationMinutes));
        setMessage("Recurring series deleted.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not delete the series.");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><button type="button" className="mv-btn mv-btn-secondary"><Repeat2 size={16} /> Recurring series</button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <Dialog.Title>Recurring series</Dialog.Title>
          <Dialog.Description>Create and manage series with one or more weekly slots. Edits sync upcoming sessions automatically.</Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="Close recurring series"><X size={18} /></Dialog.Close>
          <div className={styles.layout} aria-busy={pending}>
            <aside className={styles.list}>
              <button type="button" className={styles.newButton} onClick={createNew}><Plus size={15} /> New series</button>
              {templates.map((template) => <button type="button" key={template.id} data-active={selectedId === template.id || undefined} onClick={() => choose(template)}><strong>{template.title}</strong><span>{summarizeSlots(template.slots)} · {template.coachName}</span><small>{template.active ? "Active" : "Paused"}</small></button>)}
            </aside>
            <form className={styles.form} onSubmit={submit}>
              <label className={styles.full}>Series title<input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></label>
              <label className={styles.full}>Description<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
              <label>Type<select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as FormState["type"] }))}><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label>
              <label>Coach<select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}><option value="">Select coach</option>{coachOptions.map((coach) => <option key={coach.id} value={coach.id}>{coach.fullName}</option>)}</select></label>
              <label>Group<select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}><option value="">No linked group</option>{groupOptions.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
              <label>Duration minutes<input type="number" min="15" max="480" required value={form.durationMinutes} onChange={(event) => setForm((value) => ({ ...value, durationMinutes: event.target.value }))} /></label>
              <label>Starts on<input type="date" required value={form.startsOn} onChange={(event) => setForm((value) => ({ ...value, startsOn: event.target.value }))} /></label>
              <label>Ends on<input type="date" value={form.endsOn} onChange={(event) => setForm((value) => ({ ...value, endsOn: event.target.value }))} /></label>
              <div className={styles.full}>
                <span>Repeats on</span>
                <SeriesSlotsEditor slots={form.slots} onChange={(slots) => setForm((value) => ({ ...value, slots }))} />
              </div>
              {selected ? <section className={`${styles.generate} ${styles.full}`}><label>Generate through<input type="date" min={selected.startsOn} value={throughDate} onChange={(event) => setThroughDate(event.target.value)} /></label><button type="button" onClick={generate} disabled={pending}><CalendarRange size={15} /> Generate</button><button type="button" onClick={toggleActive} disabled={pending}>{selected.active ? <Pause size={15} /> : <Play size={15} />}{selected.active ? "Pause" : "Resume"}</button><button type="button" className={styles.deleteButton} onClick={remove} disabled={pending}><Trash2 size={15} /> Delete</button></section> : null}
              {message ? <p className={`${styles.message} ${styles.full}`} role="status">{message}</p> : null}
              <footer className={styles.full}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setOpen(false)}>Close</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : selectedId ? "Save series" : "Create series"}</button></footer>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Check `tests/recurring-time-contract.test.ts` for now-stale assertions**

That test only asserts on `datetime-local` conversion helpers in `admin-schedule-workspace.tsx`, not this manager — read it to confirm, and leave it unchanged if so.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/recurring-session-management-contract.test.ts tests/recurring-time-contract.test.ts`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/admin-recurring-session-manager.tsx tests/recurring-session-management-contract.test.ts
git commit -m "Support multiple weekday/time slots in the schedule page series manager"
```

---

### Task 8: Group repository — expose each group's linked series for the group form

**Files:**
- Modify: `lib/dashboard/admin-group-record.ts`
- Modify: `lib/repositories/admin-group-repository.ts`

**Interfaces:**
- Produces: `AdminGroupRecord.series: AdminGroupSeries | null`, new type `AdminGroupSeries = { templateId: string; durationMinutes: number; startsOn: string; endsOn: string; slots: RecurringSessionTemplateSlot[] }`.
- Consumes: `RecurringSessionTemplateSlot` from `lib/dashboard/recurring-session-template.ts` (Task 4).

Note: a group can only have zero or one series managed through this UI. If legacy data has more than one `RecurringSessionTemplate` linked to the same group, the repository picks the most recently created one (`order by "createdAt" desc` then take the first) — this matches the plan's stated assumption that the group form manages a single series per group.

- [ ] **Step 1: Add the type**

```ts
// lib/dashboard/admin-group-record.ts
import type { TrainingCategoryLabel } from "@/lib/dashboard/client-domain-labels";
import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";

export type AdminGroupType = "Group" | "Private";

export type AdminGroupMember = {
  id: string;
  fullName: string;
};

export type AdminGroupSeries = {
  templateId: string;
  durationMinutes: number;
  startsOn: string;
  endsOn: string;
  slots: RecurringSessionTemplateSlot[];
};

export type AdminGroupRecord = {
  id: string;
  name: string;
  groupType: AdminGroupType;
  trainingCategory: TrainingCategoryLabel;
  coachId: string;
  coachName: string;
  capacity: number | null;
  isActive: boolean;
  notes: string;
  memberCount: number;
  members: AdminGroupMember[];
  scheduleSummary: string;
  capacityLabel: string;
  series: AdminGroupSeries | null;
};

export type AdminGroupCoachOption = {
  id: string;
  fullName: string;
};

export type AdminGroupClientOption = {
  id: string;
  fullName: string;
  groupId: string | null;
};
```

- [ ] **Step 2: Update the repository query**

```ts
// lib/repositories/admin-group-repository.ts
import "server-only";

import type {
  AdminGroupClientOption,
  AdminGroupCoachOption,
  AdminGroupRecord,
  AdminGroupSeries,
} from "@/lib/dashboard/admin-group-record";
import { trainingCategoryLabelFor } from "@/lib/dashboard/client-domain-labels";
import { withSupabaseFallback } from "@/lib/supabase/errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatLocalTime(value: string) {
  // localStartTime is a Postgres `time` string like "18:30:00".
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${suffix}`;
}

function buildScheduleSummary(
  templates: Array<{
    active: boolean;
    slots: Array<{ weekday: number; localStartTime: string }>;
  }>,
): string {
  const activeSlots = templates
    .filter((template) => template.active)
    .flatMap((template) => template.slots)
    .sort((left, right) => left.weekday - right.weekday);

  if (!activeSlots.length) {
    return "Sessions to be determined";
  }

  return activeSlots
    .map((slot) => `${WEEKDAY_LABELS[slot.weekday] ?? "?"} ${formatLocalTime(slot.localStartTime)}`)
    .join(" · ");
}

function pickPrimarySeries(
  templates: Array<{
    id: string;
    createdAt: string;
    durationMinutes: number;
    startsOn: string;
    endsOn: string | null;
    slots: Array<{ weekday: number; localStartTime: string }>;
  }>,
): AdminGroupSeries | null {
  if (!templates.length) return null;
  const [primary] = [...templates].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  return {
    templateId: primary.id,
    durationMinutes: primary.durationMinutes,
    startsOn: primary.startsOn,
    endsOn: primary.endsOn ?? "",
    slots: primary.slots
      .map((slot) => ({ weekday: slot.weekday, localStartTime: slot.localStartTime.slice(0, 5) }))
      .sort((left, right) => left.weekday - right.weekday),
  };
}

export class AdminGroupRepository {
  async list(): Promise<{
    records: AdminGroupRecord[];
    coachOptions: AdminGroupCoachOption[];
    clientOptions: AdminGroupClientOption[];
  }> {
    const supabase = getSupabaseServerClient();

    const [records, coachOptions, clientOptions] = await Promise.all([
      withSupabaseFallback<AdminGroupRecord[]>(async () => {
        const { data, error } = await supabase
          .from("Group")
          .select(
            "id,name,type,trainingCategory,capacity,isActive,notes,createdAt,coach:Coach(id,fullName),members:Client(id,fullName),templates:RecurringSessionTemplate(id,createdAt,active,durationMinutes,startsOn,endsOn,slots:RecurringSessionSlot(weekday,localStartTime))",
          )
          .order("name");
        if (error) throw error;

        return data.map((group) => {
          const members = group.members
            .map((member) => ({ id: member.id, fullName: member.fullName }))
            .sort((left, right) => left.fullName.localeCompare(right.fullName));

          return {
            id: group.id,
            name: group.name,
            groupType: group.type === "PRIVATE" ? "Private" : "Group",
            trainingCategory: trainingCategoryLabelFor(group.trainingCategory),
            coachId: group.coach?.id ?? "",
            coachName: group.coach?.fullName ?? "Unassigned",
            capacity: group.capacity,
            isActive: group.isActive,
            notes: group.notes?.trim() ?? "",
            memberCount: members.length,
            members,
            scheduleSummary: buildScheduleSummary(group.templates),
            capacityLabel:
              group.capacity != null
                ? `${members.length} / ${group.capacity}`
                : `${members.length}`,
            series: pickPrimarySeries(group.templates),
          } satisfies AdminGroupRecord;
        });
      }, []),
      withSupabaseFallback<AdminGroupCoachOption[]>(async () => {
        const { data, error } = await supabase
          .from("Coach")
          .select("id,fullName")
          .order("fullName");
        if (error) throw error;
        return data;
      }, []),
      withSupabaseFallback<AdminGroupClientOption[]>(async () => {
        const { data, error } = await supabase
          .from("Client")
          .select("id,fullName,groupId")
          .order("fullName");
        if (error) throw error;
        return data;
      }, []),
    ]);

    return { records, coachOptions, clientOptions };
  }
}

export const adminGroupRepository = new AdminGroupRepository();
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add lib/dashboard/admin-group-record.ts lib/repositories/admin-group-repository.ts
git commit -m "Expose each group's linked recurring series to the group form"
```

---

### Task 9: Server action — `saveAdminGroup` accepts an optional series and syncs it

**Files:**
- Modify: `app/actions/admin-groups.ts`
- Create: `tests/admin-groups-series-contract.test.ts`

**Interfaces:**
- Consumes: RPC `sync_recurring_session_template` (Task 2), `recurringSessionSlotSchema` (Task 3).
- Produces: `saveAdminGroup(input: SaveAdminGroupInput & { series?: SaveAdminGroupSeriesInput }): Promise<{ id: string }>` — `SaveAdminGroupSeriesInput = { templateId?: string | null; durationMinutes: number; startsOn: string; endsOn?: string; slots: RecurringSessionSlotInput[] }`. Return value changes from `void` to `{ id: string }` so the UI can navigate to the saved group.

- [ ] **Step 1: Write the contract test**

```ts
// tests/admin-groups-series-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actions = readFileSync("app/actions/admin-groups.ts", "utf8");

describe("admin groups series integration", () => {
  it("saves the group and its series in one action", () => {
    expect(actions).toContain("save_admin_group");
    expect(actions).toContain('rpc("sync_recurring_session_template"');
    expect(actions).toContain("input.series");
  });

  it("skips the series sync when no schedule was provided", () => {
    expect(actions).toMatch(/if \(input\.series\)/);
  });

  it("keeps the admin role guard on the group save path", () => {
    expect(actions.match(/requireRole\(UserRole\.ADMIN\)/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/admin-groups-series-contract.test.ts`
Expected: FAIL — `saveAdminGroup` doesn't touch the series RPC yet.

- [ ] **Step 3: Update the server action**

```ts
// app/actions/admin-groups.ts
"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { trainingCategoryFromLabel } from "@/lib/dashboard/client-domain-labels";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GroupType, TrainingSessionType, UserRole } from "@/lib/supabase/domain";
import { recurringSessionSlotSchema } from "@/lib/validators/recurring-session";
import { z } from "zod";

type SaveAdminGroupSeriesInput = {
  templateId?: string | null;
  durationMinutes: number;
  startsOn: string;
  endsOn?: string;
  slots: Array<{ weekday: number; localStartTime: string }>;
};

type SaveAdminGroupInput = {
  groupId?: string | null;
  name: string;
  groupType: "Group" | "Private";
  trainingCategory: string;
  coachId: string;
  capacity?: string;
  isActive: boolean;
  notes?: string;
  series?: SaveAdminGroupSeriesInput;
};

const saveAdminGroupSeriesSchema = z.object({
  templateId: z.string().uuid().nullish(),
  durationMinutes: z.number().int().min(15).max(480),
  startsOn: z.string().date(),
  endsOn: z.string().date().optional(),
  slots: z.array(recurringSessionSlotSchema).min(1).max(7),
});

type DeleteAdminGroupInput = {
  groupId: string;
  confirmationText: string;
};

type GroupMembershipInput = {
  groupId: string;
  clientId: string;
  action: "add" | "remove";
};

function parseCapacity(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function revalidateGroupViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach");
}

export async function saveAdminGroup(input: SaveAdminGroupInput) {
  const user = await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();

  const name = input.name.trim();
  const coachId = input.coachId.trim();
  const capacity = parseCapacity(input.capacity);
  const notes = input.notes?.trim() || null;
  const trainingCategory = trainingCategoryFromLabel(input.trainingCategory);
  const type = input.groupType === "Private" ? GroupType.PRIVATE : GroupType.GROUP;

  if (!name) {
    throw new Error("Group name is required.");
  }

  if (!coachId) {
    throw new Error("Assign a coach to the group.");
  }

  const series = input.series ? saveAdminGroupSeriesSchema.parse(input.series) : null;

  const { data: groupId, error } = await supabase.rpc("save_admin_group", {
    p_group_id: input.groupId ?? "",
    p_name: name,
    p_type: type,
    p_training_category: trainingCategory,
    p_coach_id: coachId,
    p_capacity: capacity,
    p_is_active: input.isActive,
    p_notes: notes ?? "",
  });
  if (error) {
    if (error.message.includes("lower than current membership")) {
      throw new Error("Group capacity cannot be lower than current membership.");
    }
    throw error;
  }

  if (series) {
    const { error: seriesError } = await supabase.rpc("sync_recurring_session_template", {
      p_template_id: series.templateId ?? null,
      p_title: name,
      p_description: null,
      p_type: type === GroupType.PRIVATE ? TrainingSessionType.PRIVATE : TrainingSessionType.GROUP,
      p_coach_id: coachId,
      p_group_id: groupId as string,
      p_capacity: type === GroupType.PRIVATE ? 1 : capacity,
      p_duration_minutes: series.durationMinutes,
      p_starts_on: series.startsOn,
      p_ends_on: series.endsOn || null,
      p_slots: series.slots,
      p_created_by_id: user.id,
      p_through_date: null,
    });
    if (seriesError) {
      if (seriesError.code === "23P01") {
        throw new Error(
          "One or more generated sessions overlap another active session for this coach.",
        );
      }
      throw seriesError;
    }
  }

  revalidateGroupViews();
  return { id: groupId as string };
}

export async function deleteAdminGroup(input: DeleteAdminGroupInput) {
  await requireRole(UserRole.ADMIN);

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm removing this group.');
  }

  // Client / template / session foreign keys use ON DELETE SET NULL, so removing
  // a group unassigns its members and recurring templates without deleting them.
  const { error } = await getSupabaseServerClient()
    .from("Group")
    .delete()
    .eq("id", input.groupId);
  if (error) throw error;

  revalidateGroupViews();
}

export async function setAdminGroupMembership(input: GroupMembershipInput) {
  await requireRole(UserRole.ADMIN);
  const groupId = input.groupId.trim();
  const clientId = input.clientId.trim();

  if (!groupId || !clientId) {
    throw new Error("Group and client are required.");
  }

  const { error } = await getSupabaseServerClient().rpc(
    "set_admin_group_membership",
    {
      p_group_id: groupId,
      p_client_id: clientId,
      p_action: input.action,
    },
  );
  if (error) {
    if (error.message.includes("already at capacity")) {
      throw new Error("Group is already at capacity.");
    }
    throw error;
  }

  revalidateGroupViews();
}
```

Note: `save_admin_group` (in `supabase/migrations/20260718163000_transactional_booking_and_group_capacity.sql`) already `returns text` (the group id), confirmed by reading its definition — no preparatory migration needed here.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/admin-groups-series-contract.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Run the full existing admin-groups-adjacent suite to check for regressions**

Run: `npx vitest run tests/revalidate-path-contract.test.ts`
Expected: PASS — `saveAdminGroup` still only calls the same, already-allow-listed paths.

- [ ] **Step 6: Commit**

```bash
git add app/actions/admin-groups.ts tests/admin-groups-series-contract.test.ts
git commit -m "Let saveAdminGroup create and sync a group's recurring series"
```

---

### Task 10: Group form UI — schedule section using `SeriesSlotsEditor`

**Files:**
- Modify: `components/dashboard/admin-groups-workspace.tsx`
- Modify: `components/dashboard/admin-groups-workspace.module.css` (only if new class names need rules beyond what `.full`/`.form` already provide — check the file first)
- Create: `tests/admin-groups-workspace-series-contract.test.ts`

**Interfaces:**
- Consumes: `SeriesSlotsEditor` (Task 6), `AdminGroupRecord.series` (Task 8), `saveAdminGroup` with `series` (Task 9).

- [ ] **Step 1: Write the contract test**

```ts
// tests/admin-groups-workspace-series-contract.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workspace = readFileSync("components/dashboard/admin-groups-workspace.tsx", "utf8");

describe("admin groups workspace schedule section", () => {
  it("embeds the shared slots editor in the group form", () => {
    expect(workspace).toContain("SeriesSlotsEditor");
    expect(workspace).toContain("series:");
  });

  it("pre-fills the schedule when editing a group that already has one", () => {
    expect(workspace).toContain("record.series");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/admin-groups-workspace-series-contract.test.ts`
Expected: FAIL — the workspace doesn't reference `SeriesSlotsEditor` yet.

- [ ] **Step 3: Add schedule fields to `GroupForm` and wire the editor**

Add to the imports:

```tsx
import { SeriesSlotsEditor } from "./series-slots-editor";
import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";
import { getStudioDateKey } from "@/lib/time/studio-time";
```

Extend `GroupForm` and its defaults:

```tsx
type GroupForm = {
  name: string;
  groupType: AdminGroupRecord["groupType"];
  trainingCategory: AdminGroupRecord["trainingCategory"];
  coachId: string;
  capacity: string;
  isActive: boolean;
  notes: string;
  hasSchedule: boolean;
  templateId: string | null;
  durationMinutes: string;
  startsOn: string;
  endsOn: string;
  slots: RecurringSessionTemplateSlot[];
};

const emptyForm: GroupForm = {
  name: "",
  groupType: "Group",
  trainingCategory: "General fitness",
  coachId: "",
  capacity: "",
  isActive: true,
  notes: "",
  hasSchedule: false,
  templateId: null,
  durationMinutes: "60",
  startsOn: getStudioDateKey(),
  endsOn: "",
  slots: [{ weekday: 1, localStartTime: "18:00" }],
};
```

Update `openEdit` to pre-fill from `record.series`:

```tsx
  function openEdit(record: AdminGroupRecord) {
    setEditingId(record.id);
    setForm({
      name: record.name,
      groupType: record.groupType,
      trainingCategory: record.trainingCategory,
      coachId: record.coachId,
      capacity: record.capacity != null ? String(record.capacity) : "",
      isActive: record.isActive,
      notes: record.notes,
      hasSchedule: record.series != null,
      templateId: record.series?.templateId ?? null,
      durationMinutes: record.series ? String(record.series.durationMinutes) : "60",
      startsOn: record.series?.startsOn ?? getStudioDateKey(),
      endsOn: record.series?.endsOn ?? "",
      slots: record.series?.slots ?? [{ weekday: 1, localStartTime: "18:00" }],
    });
    setError("");
    setEditorOpen(true);
  }
```

Update `submitGroup` to include `series` when a schedule is set:

```tsx
  function submitGroup(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminGroup({
          groupId: editingId,
          name: form.name,
          groupType: form.groupType,
          trainingCategory: form.trainingCategory,
          coachId: form.coachId,
          capacity: form.capacity,
          isActive: form.isActive,
          notes: form.notes,
          series: form.hasSchedule
            ? {
                templateId: form.templateId,
                durationMinutes: Number(form.durationMinutes),
                startsOn: form.startsOn,
                endsOn: form.endsOn || undefined,
                slots: form.slots,
              }
            : undefined,
        });
        setEditorOpen(false);
        showToast(editingId ? "Group updated." : "Group created.");
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not save the group.";
        setError(description);
        showToast(description, "warning");
      }
    });
  }
```

Add the schedule section to the form JSX, right before the `notes` field:

```tsx
              <label className={`${styles.full} ${styles.checkbox}`}>
                <input
                  type="checkbox"
                  checked={form.hasSchedule}
                  onChange={(event) => setForm((value) => ({ ...value, hasSchedule: event.target.checked }))}
                />
                This group meets on a recurring schedule
              </label>
              {form.hasSchedule ? (
                <div className={styles.full}>
                  <label>Duration minutes<input type="number" min="15" max="480" required value={form.durationMinutes} onChange={(event) => setForm((value) => ({ ...value, durationMinutes: event.target.value }))} /></label>
                  <label>Starts on<input type="date" required value={form.startsOn} onChange={(event) => setForm((value) => ({ ...value, startsOn: event.target.value }))} /></label>
                  <label>Ends on<input type="date" value={form.endsOn} onChange={(event) => setForm((value) => ({ ...value, endsOn: event.target.value }))} /></label>
                  <span>Repeats on</span>
                  <SeriesSlotsEditor slots={form.slots} onChange={(slots) => setForm((value) => ({ ...value, slots }))} />
                </div>
              ) : null}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/admin-groups-workspace-series-contract.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass except the pre-existing, unrelated `tests/studio-automation-contract.test.ts` failure (missing `vercel.json`, present before this work started — confirm it's the only failure and it's the same one from the baseline run).

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/admin-groups-workspace.tsx tests/admin-groups-workspace-series-contract.test.ts
git commit -m "Add recurring schedule section to the group create/edit form"
```

---

### Task 11: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server and open the Groups page**

Use the `run` skill or `preview_start` with the project's dev server, then navigate to `/admin/groups`.

- [ ] **Step 2: Create a group with a 3-slot schedule**

Click "New group", fill in name/coach/category, check "This group meets on a recurring schedule", add two more days via "Add day" (e.g. Sun 8:00, Tue 9:00, Thu 10:00), save. Confirm the group card's schedule summary shows all three slots and the Schedule page shows generated sessions for all three going forward ~28 days.

- [ ] **Step 3: Edit the group to drop one slot and change another's time**

Open the group, remove the Thursday slot, change Tuesday from 9:00 to 9:30, save. Confirm on the Schedule page: future Thursday sessions for that group are gone/cancelled, future Tuesday sessions now show 9:30 (old 9:00 ones cancelled), Sunday sessions untouched.

- [ ] **Step 4: Confirm the schedule-page series manager still works standalone**

Open Schedule → "Recurring series" → create a new series with no linked group, multiple slots, generate occurrences, edit it, delete it (after clearing occurrences or pausing). Confirm no regressions from the multi-slot change.

- [ ] **Step 5: Report results to the user**

Summarize what was verified and any issues found — do not claim success without having actually run through these steps.

---

## Self-Review Notes

- **Spec coverage:** multi-slot data model → Task 1–2; multi-slot validation → Task 3; multi-slot save/sync/auto-cancel/auto-regenerate → Task 2 & 5; shared editor UI → Task 6; schedule-page manager updated → Task 7; group repository exposes series → Task 8; group form creates/edits series in one save → Task 9–10; manual browser verification → Task 11.
- **Type consistency:** `RecurringSessionTemplateSlot` (Task 4) is the single slot shape used everywhere — `SeriesSlotsEditor` (Task 6), the schedule manager (Task 7), `AdminGroupSeries.slots` (Task 8), and the group form's `GroupForm.slots` (Task 10) all reference it rather than redefining an equivalent shape.
- **Assumption flagged for the user:** Task 8's `pickPrimarySeries` picks the most-recently-created template if a group somehow has more than one linked — this only matters for pre-existing data created before this feature; new groups always have at most one.
