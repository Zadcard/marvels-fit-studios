create extension if not exists btree_gist with schema extensions;

alter table public."TrainingSession"
  add constraint "TrainingSession_coach_active_time_excl"
  exclude using gist (
    "coachId" with =,
    tsrange("startsAt", "endsAt", '[)') with &&
  )
  where ("status" in ('DRAFT', 'SCHEDULED'));

create or replace function public.bulk_update_training_sessions(
  p_session_ids text[],
  p_action text,
  p_coach_id text,
  p_location text,
  p_capacity integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_count integer;
  session_record record;
begin
  if p_session_ids is null or cardinality(p_session_ids) = 0 then
    raise exception 'Bulk action is incomplete.' using errcode = '22023';
  end if;
  perform 1
  from public."TrainingSession" training_session
  where training_session."id" = any(p_session_ids)
  for update;
  select count(*)
  into found_count
  from public."TrainingSession" training_session
  where training_session."id" = any(p_session_ids);
  if found_count <> cardinality(p_session_ids) then
    raise exception 'One or more selected sessions were not found.' using errcode = 'P0002';
  end if;

  if p_action = 'REASSIGN_COACH' then
    if nullif(p_coach_id, '') is null
       or not exists (
         select 1 from public."Coach" coach where coach."id" = p_coach_id
       ) then
      raise exception 'Coach record not found.' using errcode = 'P0002';
    end if;
    if exists (
      select 1
      from public."TrainingSession" first_session
      join public."TrainingSession" second_session
        on first_session."id" < second_session."id"
       and first_session."id" = any(p_session_ids)
       and second_session."id" = any(p_session_ids)
       and tsrange(first_session."startsAt", first_session."endsAt", '[)')
           && tsrange(second_session."startsAt", second_session."endsAt", '[)')
      where first_session."status" in ('DRAFT', 'SCHEDULED')
        and second_session."status" in ('DRAFT', 'SCHEDULED')
    ) then
      raise exception 'Selected sessions overlap each other.' using errcode = '23P01';
    end if;
    update public."TrainingSession" training_session
    set "coachId" = p_coach_id
    where training_session."id" = any(p_session_ids);
  elsif p_action = 'CANCEL' then
    if exists (
      select 1 from public."TrainingSession" training_session
      where training_session."id" = any(p_session_ids)
        and training_session."status" = 'COMPLETED'
    ) then
      raise exception 'Completed sessions cannot be canceled.' using errcode = 'P0001';
    end if;
    update public."SessionBooking" booking
    set "status" = 'CANCELED', "canceledAt" = current_timestamp
    where booking."trainingSessionId" = any(p_session_ids)
      and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
    update public."TrainingSession" training_session
    set "status" = 'CANCELED'
    where training_session."id" = any(p_session_ids)
      and training_session."status" <> 'CANCELED';
  elsif p_action = 'UPDATE_LOCATION' then
    if nullif(trim(p_location), '') is null then
      raise exception 'Bulk action is incomplete.' using errcode = '22023';
    end if;
    update public."TrainingSession" training_session
    set "location" = nullif(trim(p_location), '')
    where training_session."id" = any(p_session_ids);
  elsif p_action = 'UPDATE_CAPACITY' then
    if p_capacity is null or p_capacity < 1 then
      raise exception 'Bulk action is incomplete.' using errcode = '22023';
    end if;
    for session_record in
      select training_session."id", training_session."type"
      from public."TrainingSession" training_session
      where training_session."id" = any(p_session_ids)
    loop
      if session_record."type" <> 'PRIVATE'
         and (
           select count(*)
           from public."SessionBooking" booking
           where booking."trainingSessionId" = session_record."id"
             and booking."status" in ('BOOKED', 'ATTENDED')
         ) > p_capacity then
        raise exception 'Capacity cannot be lower than the current active roster.' using errcode = '22023';
      end if;
    end loop;
    update public."TrainingSession" training_session
    set "capacity" = p_capacity
    where training_session."id" = any(p_session_ids)
      and training_session."type" <> 'PRIVATE';
  else
    raise exception 'Bulk action is incomplete.' using errcode = '22023';
  end if;

  return found_count;
end;
$$;

create or replace function public.bulk_update_session_attendance(
  p_training_session_id text,
  p_client_ids text[],
  p_status public."BookingStatus"
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  client_id text;
begin
  if p_client_ids is null or cardinality(p_client_ids) = 0 then
    return 0;
  end if;
  foreach client_id in array p_client_ids loop
    perform *
    from public.update_session_attendance(
      p_training_session_id,
      client_id,
      p_status
    );
  end loop;
  return cardinality(p_client_ids);
end;
$$;

revoke all on function public.bulk_update_training_sessions(
  text[], text, text, text, integer
) from public, anon, authenticated;
revoke all on function public.bulk_update_session_attendance(
  text, text[], public."BookingStatus"
) from public, anon, authenticated;
grant execute on function public.bulk_update_training_sessions(
  text[], text, text, text, integer
) to service_role;
grant execute on function public.bulk_update_session_attendance(
  text, text[], public."BookingStatus"
) to service_role;
