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
