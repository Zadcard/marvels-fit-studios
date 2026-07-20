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
