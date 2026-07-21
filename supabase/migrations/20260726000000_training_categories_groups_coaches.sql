-- Normalize training categories and remove the retired floor/capacity model.
-- This migration is data preserving and intentionally fails before making the
-- Group relationship required if any stored category cannot be mapped.

begin;

-- Free the canonical relation name while preserving every legacy enum value
-- and every column that still uses it (Client and Lead remain out of scope).
alter type public."TrainingCategory" rename to "LegacyTrainingCategory";

create table public."TrainingCategory" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "slug" text not null,
  "legacyValue" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp,
  constraint "TrainingCategory_name_not_blank" check (length(trim("name")) > 0),
  constraint "TrainingCategory_slug_not_blank" check (length(trim("slug")) > 0),
  constraint "TrainingCategory_slug_key" unique ("slug"),
  constraint "TrainingCategory_legacyValue_key" unique ("legacyValue")
);

create unique index "TrainingCategory_name_lower_key"
  on public."TrainingCategory" (lower(trim("name")));
create index "TrainingCategory_isActive_idx"
  on public."TrainingCategory" ("isActive");

-- Only values already persisted in the database are materialized. The names
-- are the established UI labels for the legacy enum values.
insert into public."TrainingCategory" ("name", "slug", "legacyValue")
select
  case legacy_value
    when 'FOOTBALL' then 'Football'
    when 'TENNIS' then 'Tennis'
    when 'OTHER_SPORT' then 'Other sport'
    when 'FAT_LOSS' then 'Fat loss'
    when 'MUSCLE_GAIN' then 'Muscle gain'
    when 'CALISTHENICS' then 'Calisthenics'
    when 'REHAB' then 'Rehab'
    when 'GENERAL_FITNESS' then 'General fitness'
  end,
  lower(replace(legacy_value, '_', '-')),
  legacy_value
from (
  select distinct "trainingCategory"::text as legacy_value from public."Group"
  union
  select distinct "trainingCategory"::text from public."Client"
  union
  select distinct "interestedCategory"::text from public."Lead" where "interestedCategory" is not null
) stored_categories
where legacy_value is not null
on conflict ("legacyValue") do nothing;

alter table public."Group" add column "categoryId" text;

update public."Group" studio_group
set "categoryId" = category."id"
from public."TrainingCategory" category
where category."legacyValue" = studio_group."trainingCategory"::text;

do $$
begin
  if exists (select 1 from public."Group" where "categoryId" is null) then
    raise exception 'Category backfill failed for one or more groups.' using errcode = '23502';
  end if;
end;
$$;

alter table public."Group"
  alter column "categoryId" set not null,
  add constraint "Group_categoryId_fkey"
    foreign key ("categoryId") references public."TrainingCategory"("id")
    on delete restrict on update cascade;
create index "Group_categoryId_idx" on public."Group" ("categoryId");

create table public."CoachTrainingCategory" (
  "coachId" text not null,
  "categoryId" text not null,
  "createdAt" timestamptz not null default current_timestamp,
  constraint "CoachTrainingCategory_pkey" primary key ("coachId", "categoryId"),
  constraint "CoachTrainingCategory_coachId_fkey"
    foreign key ("coachId") references public."Coach"("id")
    on delete cascade on update cascade,
  constraint "CoachTrainingCategory_categoryId_fkey"
    foreign key ("categoryId") references public."TrainingCategory"("id")
    on delete restrict on update cascade
);
create index "CoachTrainingCategory_categoryId_idx"
  on public."CoachTrainingCategory" ("categoryId");

-- A current group assignment is reliable evidence that the coach is qualified
-- for that category.
insert into public."CoachTrainingCategory" ("coachId", "categoryId")
select distinct "coachId", "categoryId"
from public."Group"
on conflict do nothing;

-- Add only exact legacy enum matches; do not infer approximate specialties.
insert into public."CoachTrainingCategory" ("coachId", "categoryId")
select coach."id", category."id"
from public."Coach" coach
join public."TrainingCategory" category
  on category."legacyValue" = coach."specialization"::text
on conflict do nothing;

-- Retire old signatures before removing their columns/parameters.
drop function if exists public.save_admin_group(
  text, text, public."GroupType", public."LegacyTrainingCategory", text, integer, boolean, text
);
drop function if exists public.update_training_session(
  text, text, text, public."TrainingSessionType", public."TrainingSessionStatus",
  text, text, text, timestamptz, timestamptz, integer
);
drop function if exists public.bulk_update_training_sessions(text[], text, text, text, integer);
drop function if exists public.sync_recurring_session_template(
  uuid, text, text, public."TrainingSessionType", text, text, integer,
  integer, date, date, jsonb, text, date
);
drop function if exists public.save_coach(
  text, text, text, text, public."CoachSpecialization", text
);

alter table public."RecurringSessionTemplate"
  drop constraint if exists "RecurringSessionTemplate_capacity_check";
drop index if exists public."Group_trainingCategory_idx";
alter table public."Group" drop column "trainingCategory", drop column "capacity";
alter table public."TrainingSession" drop column "capacity";
alter table public."RecurringSessionTemplate" drop column "capacity";

create or replace function public.save_admin_group(
  p_group_id text,
  p_name text,
  p_type public."GroupType",
  p_category_id text,
  p_coach_id text,
  p_is_active boolean,
  p_notes text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_group_id text;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Group name is required.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public."TrainingCategory" category
    where category."id" = p_category_id
  ) then
    raise exception 'Training category not found.' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public."TrainingCategory" category
    where category."id" = p_category_id
      and (
        category."isActive"
        or exists (
          select 1 from public."Group" existing_group
          where existing_group."id" = nullif(p_group_id, '')
            and existing_group."categoryId" = p_category_id
        )
      )
  ) then
    raise exception 'Archived categories cannot be assigned to a group.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public."Coach" coach where coach."id" = p_coach_id
  ) then
    raise exception 'Coach record not found.' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public."CoachTrainingCategory" qualification
    where qualification."coachId" = p_coach_id
      and qualification."categoryId" = p_category_id
  ) then
    raise exception 'The selected coach is not qualified for this category.' using errcode = '22023';
  end if;

  if nullif(p_group_id, '') is null then
    insert into public."Group" (
      "name", "type", "categoryId", "coachId", "isActive", "notes"
    ) values (
      trim(p_name), p_type, p_category_id, p_coach_id, p_is_active,
      nullif(trim(p_notes), '')
    ) returning "id" into target_group_id;
  else
    update public."Group"
    set
      "name" = trim(p_name),
      "type" = p_type,
      "categoryId" = p_category_id,
      "coachId" = p_coach_id,
      "isActive" = p_is_active,
      "notes" = nullif(trim(p_notes), '')
    where "id" = p_group_id
    returning "id" into target_group_id;
    if target_group_id is null then
      raise exception 'Group record not found.' using errcode = 'P0002';
    end if;
  end if;
  return target_group_id;
end;
$$;

create or replace function public.set_admin_group_membership(
  p_group_id text,
  p_client_id text,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public."Group" where "id" = p_group_id for update;
  if not found then
    raise exception 'Group record not found.' using errcode = 'P0002';
  end if;
  perform 1 from public."Client" where "id" = p_client_id for update;
  if not found then
    raise exception 'Client record not found.' using errcode = 'P0002';
  end if;
  if p_action = 'add' then
    update public."Client" set "groupId" = p_group_id where "id" = p_client_id;
  elsif p_action = 'remove' then
    update public."Client" set "groupId" = null
    where "id" = p_client_id and "groupId" = p_group_id;
  else
    raise exception 'Invalid group membership action.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.save_coach(
  p_coach_id text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_specialization public."CoachSpecialization",
  p_password_hash text,
  p_category_ids text[]
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id text;
  target_coach_id text;
  missing_category_count integer;
begin
  if p_category_ids is null or cardinality(p_category_ids) = 0 then
    raise exception 'Choose at least one qualified category.' using errcode = '22023';
  end if;
  select count(*) into missing_category_count
  from unnest(p_category_ids) requested("id")
  left join public."TrainingCategory" category
    on category."id" = requested."id"
    and (
      category."isActive"
      or exists (
        select 1 from public."CoachTrainingCategory" existing_qualification
        where existing_qualification."coachId" = nullif(p_coach_id, '')
          and existing_qualification."categoryId" = requested."id"
      )
    )
  where category."id" is null;
  if missing_category_count > 0 then
    raise exception 'One or more training categories are unavailable.' using errcode = '22023';
  end if;

  if nullif(p_coach_id, '') is not null then
    select "userId" into target_user_id
    from public."Coach" where "id" = p_coach_id for update;
    if target_user_id is null then
      raise exception 'Coach record not found.' using errcode = 'P0002';
    end if;
    if exists (
      select 1 from public."User"
      where "email" = p_email and "id" <> target_user_id
    ) then
      raise exception 'Another user already uses this email.' using errcode = '23505';
    end if;
    update public."User"
    set "name" = p_full_name, "email" = p_email, "updatedAt" = now()
    where "id" = target_user_id;
    update public."Coach"
    set "fullName" = p_full_name, "phone" = nullif(p_phone, ''),
        "specialization" = p_specialization
    where "id" = p_coach_id;
    target_coach_id := p_coach_id;
  else
    if exists (select 1 from public."User" where "email" = p_email) then
      raise exception 'A user with this email already exists.' using errcode = '23505';
    end if;
    insert into public."User" ("name", "email", "password", "mustChangePassword", "role")
    values (p_full_name, p_email, p_password_hash, true, 'COACH')
    returning "id" into target_user_id;
    insert into public."Coach" ("fullName", "phone", "specialization", "userId")
    values (p_full_name, nullif(p_phone, ''), p_specialization, target_user_id)
    returning "id" into target_coach_id;
  end if;

  if exists (
    select 1 from public."Group" studio_group
    where studio_group."coachId" = target_coach_id
      and not (studio_group."categoryId" = any(p_category_ids))
  ) then
    raise exception 'A qualification used by an assigned group cannot be removed.' using errcode = '23503';
  end if;

  delete from public."CoachTrainingCategory"
  where "coachId" = target_coach_id
    and not ("categoryId" = any(p_category_ids));
  insert into public."CoachTrainingCategory" ("coachId", "categoryId")
  select target_coach_id, requested.category_id
  from unnest(p_category_ids) as requested(category_id)
  on conflict do nothing;
  return target_coach_id;
end;
$$;

create or replace function public.book_client_into_session(
  p_session_id text,
  p_client_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public."TrainingSession"%rowtype;
  existing_booking public."SessionBooking"%rowtype;
  active_booking public."SessionBooking"%rowtype;
  saved_booking public."SessionBooking"%rowtype;
begin
  select * into session_record from public."TrainingSession"
  where "id" = p_session_id for update;
  if not found then raise exception 'Session record not found.' using errcode = 'P0002'; end if;
  if session_record."status" in ('CANCELED', 'COMPLETED') then
    raise exception 'Bookings can only be changed for active sessions.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public."Client" where "id" = p_client_id) then
    raise exception 'Client record not found.' using errcode = 'P0002';
  end if;
  select * into existing_booking from public."SessionBooking"
  where "trainingSessionId" = p_session_id and "clientId" = p_client_id for update;
  if found and existing_booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST') then
    raise exception 'This client is already assigned to the session.' using errcode = '23505';
  end if;
  if session_record."type" = 'PRIVATE' then
    select * into active_booking from public."SessionBooking"
    where "trainingSessionId" = p_session_id and "clientId" <> p_client_id
      and "status" in ('BOOKED', 'ATTENDED', 'WAITLIST')
    order by "bookedAt" limit 1 for update;
    if found then
      update public."SessionBooking"
      set "status" = 'CANCELED', "attendedAt" = null, "canceledAt" = current_timestamp
      where "id" = active_booking."id";
    end if;
  end if;
  if existing_booking."id" is not null then
    update public."SessionBooking"
    set "status" = 'BOOKED', "source" = 'MANUAL', "bookedAt" = current_timestamp,
        "attendedAt" = null, "canceledAt" = null
    where "id" = existing_booking."id" returning * into saved_booking;
  else
    insert into public."SessionBooking" ("trainingSessionId", "clientId", "status", "source")
    values (p_session_id, p_client_id, 'BOOKED', 'MANUAL') returning * into saved_booking;
  end if;
  return jsonb_build_object('id', saved_booking."id", 'status', saved_booking."status");
end;
$$;

create or replace function public.update_training_session(
  p_session_id text,
  p_title text,
  p_description text,
  p_type public."TrainingSessionType",
  p_status public."TrainingSessionStatus",
  p_coach_id text,
  p_group_id text,
  p_location text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns table (id text)
language plpgsql
security definer
set search_path = ''
as $$
declare current_status public."TrainingSessionStatus"; active_count integer;
begin
  if not exists (select 1 from public."Coach" where "id" = p_coach_id) then
    raise exception 'Coach record not found.' using errcode = 'P0002';
  end if;
  if nullif(p_group_id, '') is not null
     and not exists (select 1 from public."Group" where "id" = p_group_id) then
    raise exception 'Group record not found.' using errcode = 'P0002';
  end if;
  if p_status = 'CANCELED' then
    raise exception 'Use the cancellation operation to cancel sessions.' using errcode = 'P0001';
  end if;
  select "status" into current_status from public."TrainingSession"
  where "id" = p_session_id for update;
  if current_status is null then raise exception 'Session record not found.' using errcode = 'P0002'; end if;
  if current_status = 'CANCELED' then raise exception 'Canceled sessions cannot be edited.' using errcode = 'P0001'; end if;
  if p_type = 'PRIVATE' then
    select count(*) into active_count from public."SessionBooking"
    where "trainingSessionId" = p_session_id and "status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
    if active_count > 1 then
      raise exception 'Private sessions can only have one active booking.' using errcode = '22023';
    end if;
  end if;
  update public."TrainingSession"
  set "title" = trim(p_title), "description" = nullif(trim(p_description), ''),
      "type" = p_type, "status" = p_status, "coachId" = p_coach_id,
      "groupId" = nullif(p_group_id, ''), "location" = nullif(trim(p_location), ''),
      "startsAt" = p_starts_at, "endsAt" = p_ends_at
  where "id" = p_session_id;
  return query select p_session_id;
end;
$$;

create or replace function public.bulk_update_training_sessions(
  p_session_ids text[],
  p_action text,
  p_coach_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare found_count integer;
begin
  if p_session_ids is null or cardinality(p_session_ids) = 0 then
    raise exception 'Bulk action is incomplete.' using errcode = '22023';
  end if;
  perform 1 from public."TrainingSession" where "id" = any(p_session_ids) for update;
  select count(*) into found_count from public."TrainingSession" where "id" = any(p_session_ids);
  if found_count <> cardinality(p_session_ids) then
    raise exception 'One or more selected sessions were not found.' using errcode = 'P0002';
  end if;
  if p_action = 'REASSIGN_COACH' then
    if nullif(p_coach_id, '') is null
       or not exists (select 1 from public."Coach" where "id" = p_coach_id) then
      raise exception 'Coach record not found.' using errcode = 'P0002';
    end if;
    update public."TrainingSession" set "coachId" = p_coach_id where "id" = any(p_session_ids);
  elsif p_action = 'CANCEL' then
    if exists (select 1 from public."TrainingSession" where "id" = any(p_session_ids) and "status" = 'COMPLETED') then
      raise exception 'Completed sessions cannot be canceled.' using errcode = 'P0001';
    end if;
    update public."SessionBooking" set "status" = 'CANCELED', "canceledAt" = current_timestamp
    where "trainingSessionId" = any(p_session_ids) and "status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
    update public."TrainingSession" set "status" = 'CANCELED'
    where "id" = any(p_session_ids) and "status" <> 'CANCELED';
  else
    raise exception 'Bulk action is incomplete.' using errcode = '22023';
  end if;
  return found_count;
end;
$$;

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
  select * into template from public."RecurringSessionTemplate"
  where "id" = p_template_id for update;
  if not found then raise exception 'Recurring session template not found.' using errcode = 'P0002'; end if;
  if not template."active" then raise exception 'Recurring session template is inactive.' using errcode = '22023'; end if;
  if p_through_date < template."startsOn" then raise exception 'Generation date is before the template start date.' using errcode = '22023'; end if;
  for slot_record in select * from public."RecurringSessionSlot" where "templateId" = p_template_id loop
    for occurrence_date in
      select day::date from generate_series(
        template."startsOn"::timestamp,
        least(p_through_date, coalesce(template."endsOn", p_through_date))::timestamp,
        interval '1 day'
      ) day where extract(dow from day)::integer = slot_record."weekday"
    loop
      occurrence_start := (occurrence_date + slot_record."localStartTime") at time zone template."timezone";
      insert into public."TrainingSession" (
        "title", "description", "type", "status", "startsAt", "endsAt",
        "coachId", "groupId", "createdById", "sourceTemplateId", "sourceSlotId"
      ) values (
        template."title", template."description", template."type", template."status",
        occurrence_start, occurrence_start + make_interval(mins => template."durationMinutes"),
        template."coachId", template."groupId", template."createdById", template."id", slot_record."id"
      ) on conflict ("sourceSlotId", "startsAt") where "sourceSlotId" is not null do nothing;
      if found then generated_count := generated_count + 1; end if;
    end loop;
  end loop;
  update public."RecurringSessionTemplate"
  set "lastGeneratedThrough" = greatest(coalesce("lastGeneratedThrough", p_through_date), p_through_date)
  where "id" = p_template_id;
  return generated_count;
end;
$$;

-- The slot-diff behavior remains unchanged; only the retired capacity argument
-- and column writes are removed.
create or replace function public.sync_recurring_session_template(
  p_template_id uuid,
  p_title text,
  p_description text,
  p_type public."TrainingSessionType",
  p_coach_id text,
  p_group_id text,
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
      "title", "description", "type", "coachId", "groupId",
      "durationMinutes", "startsOn", "endsOn", "createdById"
    ) values (
      p_title, p_description, p_type, p_coach_id, p_group_id,
      p_duration_minutes, p_starts_on, p_ends_on, p_created_by_id
    ) returning "id" into v_template_id;
  else
    update public."RecurringSessionTemplate"
    set "title" = p_title, "description" = p_description, "type" = p_type,
        "coachId" = p_coach_id, "groupId" = p_group_id,
        "durationMinutes" = p_duration_minutes, "startsOn" = p_starts_on,
        "endsOn" = p_ends_on
    where "id" = p_template_id returning "id" into v_template_id;
    if v_template_id is null then raise exception 'Recurring session template not found.' using errcode = 'P0002'; end if;
  end if;
  for existing_slot in
    select slot.* from public."RecurringSessionSlot" slot
    where slot."templateId" = v_template_id
      and not exists (
        select 1 from jsonb_to_recordset(p_slots) as requested(weekday integer, "localStartTime" time)
        where requested.weekday = slot."weekday" and requested."localStartTime" = slot."localStartTime"
      )
  loop
    update public."SessionBooking" set "status" = 'CANCELED', "canceledAt" = current_timestamp
    where "trainingSessionId" in (
      select "id" from public."TrainingSession"
      where "sourceSlotId" = existing_slot."id" and "status" = 'SCHEDULED' and "startsAt" > now()
    ) and "status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
    update public."TrainingSession" set "status" = 'CANCELED'
    where "sourceSlotId" = existing_slot."id" and "status" = 'SCHEDULED' and "startsAt" > now();
    delete from public."RecurringSessionSlot" where "id" = existing_slot."id";
  end loop;
  for requested_slot in
    select * from jsonb_to_recordset(p_slots) as requested(weekday integer, "localStartTime" time)
  loop
    insert into public."RecurringSessionSlot" ("templateId", "weekday", "localStartTime")
    values (v_template_id, requested_slot.weekday, requested_slot."localStartTime")
    on conflict ("templateId", "weekday", "localStartTime") do nothing;
  end loop;
  select greatest(coalesce(p_through_date, "lastGeneratedThrough", p_starts_on + 28), p_starts_on)
  into v_through from public."RecurringSessionTemplate" where "id" = v_template_id;
  perform public.generate_recurring_sessions(v_template_id, v_through);
  return v_template_id;
end;
$$;

-- Schedule-change requests are deliberately not redesigned in this phase.
-- Recompile their existing functions only to follow the normalized Group key
-- and the unlimited-membership model. The guarded replacements make schema
-- drift fail the migration instead of leaving a broken function behind.
do $compatibility$
declare
  original_definition text;
  updated_definition text;
  retired_limit_block text := $block$      select "capacity" into to_group_capacity
      from public."Group" grp where grp."id" = request_record."toGroupId" for update;
      if to_group_capacity is not null then
        select count(*) into to_group_member_count
        from public."Client" client
        where client."groupId" = request_record."toGroupId";
        if to_group_member_count >= to_group_capacity then
          raise exception 'The new group is already at capacity.' using errcode = '22023';
        end if;
      end if;

$block$;
begin
  original_definition := pg_get_functiondef(
    'public.log_schedule_change_request(text,text,text,text,text,text,text,integer[],integer[],date,text)'::regprocedure
  );
  updated_definition := replace(
    replace(
      replace(
        replace(original_definition,
          'source_category public."TrainingCategory";',
          'source_category text;'),
        'target_category public."TrainingCategory";',
        'target_category text;'),
      'select "trainingCategory" into source_category',
      'select "categoryId" into source_category'),
    'select "trainingCategory" into target_category',
    'select "categoryId" into target_category'
  );
  if updated_definition = original_definition or updated_definition like '%"trainingCategory"%' then
    raise exception 'Could not update schedule-change category compatibility.';
  end if;
  execute updated_definition;

  original_definition := pg_get_functiondef(
    'public.decide_schedule_change_request(uuid,text,text)'::regprocedure
  );
  updated_definition := replace(original_definition, '  to_group_capacity integer;' || chr(10), '');
  updated_definition := replace(updated_definition, '  to_group_member_count integer;' || chr(10), '');
  updated_definition := replace(updated_definition, retired_limit_block, '');
  if updated_definition = original_definition or updated_definition like '%"capacity"%' then
    raise exception 'Could not update schedule-change membership compatibility.';
  end if;
  execute updated_definition;
end;
$compatibility$;

alter table public."TrainingCategory" enable row level security;
alter table public."CoachTrainingCategory" enable row level security;

revoke all on function public.save_admin_group(
  text, text, public."GroupType", text, text, boolean, text
) from public, anon, authenticated;
grant execute on function public.save_admin_group(
  text, text, public."GroupType", text, text, boolean, text
) to service_role;
revoke all on function public.set_admin_group_membership(text, text, text)
from public, anon, authenticated;
grant execute on function public.set_admin_group_membership(text, text, text)
to service_role;
revoke all on function public.save_coach(
  text, text, text, text, public."CoachSpecialization", text, text[]
) from public, anon, authenticated;
grant execute on function public.save_coach(
  text, text, text, text, public."CoachSpecialization", text, text[]
) to service_role;
revoke all on function public.book_client_into_session(text, text)
from public, anon, authenticated;
grant execute on function public.book_client_into_session(text, text)
to service_role;
revoke all on function public.update_training_session(
  text, text, text, public."TrainingSessionType", public."TrainingSessionStatus",
  text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.update_training_session(
  text, text, text, public."TrainingSessionType", public."TrainingSessionStatus",
  text, text, text, timestamptz, timestamptz
) to service_role;
revoke all on function public.bulk_update_training_sessions(text[], text, text)
from public, anon, authenticated;
grant execute on function public.bulk_update_training_sessions(text[], text, text)
to service_role;
revoke all on function public.sync_recurring_session_template(
  uuid, text, text, public."TrainingSessionType", text, text,
  integer, date, date, jsonb, text, date
) from public, anon, authenticated;
grant execute on function public.sync_recurring_session_template(
  uuid, text, text, public."TrainingSessionType", text, text,
  integer, date, date, jsonb, text, date
) to service_role;

commit;
