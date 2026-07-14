create table "RecurringSessionTemplate" (
  "id" uuid primary key default gen_random_uuid(),
  "title" text not null,
  "description" text,
  "type" "TrainingSessionType" not null,
  "status" "TrainingSessionStatus" not null default 'SCHEDULED',
  "coachId" text not null references "Coach"("id") on delete restrict,
  "groupId" text references "Group"("id") on delete set null,
  "location" text,
  "capacity" integer,
  "timezone" text not null default 'Africa/Cairo',
  "weekday" integer not null check ("weekday" between 0 and 6),
  "localStartTime" time not null,
  "durationMinutes" integer not null check ("durationMinutes" between 15 and 480),
  "startsOn" date not null,
  "endsOn" date,
  "active" boolean not null default true,
  "lastGeneratedThrough" date,
  "createdById" text not null references "User"("id") on delete restrict,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check ("endsOn" is null or "endsOn" >= "startsOn"),
  check (("type" = 'PRIVATE' and "capacity" = 1) or ("type" = 'GROUP' and "capacity" > 0))
);

alter table "TrainingSession"
  add column "sourceTemplateId" uuid references "RecurringSessionTemplate"("id") on delete set null;

create unique index "TrainingSession_template_start_unique_idx"
  on "TrainingSession" ("sourceTemplateId", "startsAt")
  where "sourceTemplateId" is not null;
create index "RecurringSessionTemplate_active_idx"
  on "RecurringSessionTemplate" ("active", "startsOn", "endsOn");

create trigger "RecurringSessionTemplate_set_updated_at"
before update on "RecurringSessionTemplate"
for each row execute function public.set_updated_at();

alter table "RecurringSessionTemplate" enable row level security;
revoke all on table "RecurringSessionTemplate" from anon, authenticated;
grant all on table "RecurringSessionTemplate" to service_role;

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

  for occurrence_date in
    select day::date
    from generate_series(
      template."startsOn"::timestamp,
      least(p_through_date, coalesce(template."endsOn", p_through_date))::timestamp,
      interval '1 day'
    ) day
    where extract(dow from day)::integer = template."weekday"
  loop
    occurrence_start := (occurrence_date + template."localStartTime") at time zone template."timezone";

    insert into public."TrainingSession" (
      "title", "description", "type", "status", "startsAt", "endsAt",
      "capacity", "location", "coachId", "groupId", "createdById", "sourceTemplateId"
    ) values (
      template."title", template."description", template."type", template."status",
      occurrence_start, occurrence_start + make_interval(mins => template."durationMinutes"),
      template."capacity", template."location", template."coachId", template."groupId",
      template."createdById", template."id"
    )
    on conflict ("sourceTemplateId", "startsAt") where "sourceTemplateId" is not null do nothing;

    if found then generated_count := generated_count + 1; end if;
  end loop;

  update public."RecurringSessionTemplate"
  set "lastGeneratedThrough" = greatest(coalesce("lastGeneratedThrough", p_through_date), p_through_date)
  where "id" = p_template_id;

  return generated_count;
end;
$$;

revoke all on function public.generate_recurring_sessions(uuid, date)
  from public, anon, authenticated;
grant execute on function public.generate_recurring_sessions(uuid, date)
  to service_role;
