drop function if exists public.update_training_session(
  text,
  text,
  text,
  public."TrainingSessionType",
  public."TrainingSessionStatus",
  text,
  text,
  timestamptz,
  timestamptz,
  integer
);

create function public.update_training_session(
  p_session_id text,
  p_title text,
  p_description text,
  p_type public."TrainingSessionType",
  p_status public."TrainingSessionStatus",
  p_coach_id text,
  p_group_id text,
  p_location text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_capacity integer
)
returns table (id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public."TrainingSessionStatus";
  active_count integer;
  normalized_capacity integer;
begin
  if not exists (select 1 from public."Coach" coach where coach."id" = p_coach_id) then
    raise exception 'Coach record not found.' using errcode = 'P0002';
  end if;
  if nullif(p_group_id, '') is not null
     and not exists (select 1 from public."Group" studio_group where studio_group."id" = p_group_id) then
    raise exception 'Group record not found.' using errcode = 'P0002';
  end if;
  if p_status = 'CANCELED' then
    raise exception 'Use the cancellation operation to cancel sessions.' using errcode = 'P0001';
  end if;

  select "status"
  into current_status
  from public."TrainingSession" session_record
  where session_record."id" = p_session_id
  for update;
  if current_status is null then
    raise exception 'Session record not found.' using errcode = 'P0002';
  end if;
  if current_status = 'CANCELED' then
    raise exception 'Canceled sessions cannot be edited.' using errcode = 'P0001';
  end if;

  normalized_capacity := case
    when p_type = 'PRIVATE' then 1
    else nullif(p_capacity, -1)
  end;
  select count(*)
  into active_count
  from public."SessionBooking" booking
  where booking."trainingSessionId" = p_session_id
    and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
  if p_type <> 'PRIVATE'
     and normalized_capacity is not null
     and active_count > normalized_capacity then
    raise exception 'Capacity cannot be lower than the current active roster.' using errcode = '22023';
  end if;
  if p_type = 'PRIVATE' and active_count > 1 then
    raise exception 'Capacity cannot be lower than the current active roster.' using errcode = '22023';
  end if;

  update public."TrainingSession" session_record
  set
    "title" = trim(p_title),
    "description" = nullif(trim(p_description), ''),
    "type" = p_type,
    "status" = p_status,
    "coachId" = p_coach_id,
    "groupId" = nullif(p_group_id, ''),
    "location" = nullif(trim(p_location), ''),
    "startsAt" = p_starts_at,
    "endsAt" = p_ends_at,
    "capacity" = normalized_capacity
  where session_record."id" = p_session_id;

  return query select p_session_id;
end;
$$;

create or replace function public.delete_training_session(p_session_id text)
returns table (id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public."TrainingSessionStatus";
begin
  select "status"
  into current_status
  from public."TrainingSession" session_record
  where session_record."id" = p_session_id
  for update;
  if current_status is null then
    raise exception 'Session record not found.' using errcode = 'P0002';
  end if;
  if current_status <> 'DRAFT'
     or exists (
       select 1 from public."SessionBooking" booking
       where booking."trainingSessionId" = p_session_id
     ) then
    raise exception 'Only empty draft sessions can be deleted.' using errcode = 'P0001';
  end if;

  delete from public."TrainingSession" session_record
  where session_record."id" = p_session_id;
  return query select p_session_id;
end;
$$;

revoke all on function public.update_training_session(
  text,
  text,
  text,
  public."TrainingSessionType",
  public."TrainingSessionStatus",
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer
) from public, anon, authenticated;
revoke all on function public.delete_training_session(text)
from public, anon, authenticated;

grant execute on function public.update_training_session(
  text,
  text,
  text,
  public."TrainingSessionType",
  public."TrainingSessionStatus",
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  integer
) to service_role;
grant execute on function public.delete_training_session(text) to service_role;
