begin;

do $$
declare
  template_id uuid;
  coach_id text;
  creator_id text;
  generated_count integer;
  occurrence_id text;
  local_start timestamp;
  is_exception boolean;
begin
  select id into coach_id from public."Coach" order by id limit 1;
  select id into creator_id from public."User" where role = 'ADMIN' order by id limit 1;
  if coach_id is null or creator_id is null then
    raise exception 'Verification requires an existing coach and admin.';
  end if;

  insert into public."RecurringSessionTemplate" (
    title, type, "coachId", capacity, timezone, weekday, "localStartTime",
    "durationMinutes", "startsOn", "endsOn", "createdById"
  ) values (
    'Recurring Cairo verification', 'GROUP', coach_id, 10, 'Africa/Cairo', 1,
    '18:30', 60, '2099-07-20', '2099-07-20', creator_id
  ) returning id into template_id;

  generated_count := public.generate_recurring_sessions(template_id, '2099-07-20');
  if generated_count <> 1 then
    raise exception 'Expected one generated occurrence, got %.', generated_count;
  end if;

  select id, "startsAt" at time zone 'Africa/Cairo'
  into occurrence_id, local_start
  from public."TrainingSession"
  where "sourceTemplateId" = template_id;
  if local_start <> timestamp '2099-07-20 18:30:00' then
    raise exception 'Generated occurrence did not preserve Cairo wall time.';
  end if;

  begin
    insert into public."TrainingSession" (
      id, title, type, status, "startsAt", "endsAt", capacity, "coachId",
      "createdById", "sourceTemplateId"
    ) values (
      'verify-mismatched-recurring-occurrence', 'Mismatch', 'GROUP', 'DRAFT',
      timestamptz '2099-07-21 15:30:00+00', timestamptz '2099-07-21 16:30:00+00',
      10, coach_id, creator_id, template_id
    );
    raise exception 'Mismatched template link was accepted.';
  exception
    when check_violation then null;
  end;

  update public."TrainingSession"
  set
    "startsAt" = "startsAt" + interval '1 day',
    "endsAt" = "endsAt" + interval '1 day'
  where id = occurrence_id;

  select "isTemplateException" into is_exception
  from public."TrainingSession" where id = occurrence_id;
  if not is_exception then
    raise exception 'Occurrence override was not marked as an exception.';
  end if;
end;
$$;

rollback;

select
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'TrainingSession'
      and column_name = 'startsAt'
  ) as starts_at_type,
  (
    select count(*)
    from public."TrainingSession" session
    join public."RecurringSessionTemplate" template
      on template.id = session."sourceTemplateId"
    where not session."isTemplateException"
      and (
        extract(dow from session."startsAt" at time zone template.timezone)::integer
          <> template.weekday
        or (session."startsAt" at time zone template.timezone)::time(0)
          <> template."localStartTime"::time(0)
      )
  ) as non_exception_template_mismatches;
