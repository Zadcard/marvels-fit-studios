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
  seated_count integer;
  waitlist_enabled boolean := false;
  next_status public."BookingStatus" := 'BOOKED'::public."BookingStatus";
  saved_booking public."SessionBooking"%rowtype;
begin
  select *
  into session_record
  from public."TrainingSession" training_session
  where training_session."id" = p_session_id
  for update;
  if not found then
    raise exception 'Session record not found.' using errcode = 'P0002';
  end if;
  if session_record."status" in ('CANCELED', 'COMPLETED') then
    raise exception 'Bookings can only be changed for active sessions.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public."Client" client where client."id" = p_client_id
  ) then
    raise exception 'Client record not found.' using errcode = 'P0002';
  end if;

  select *
  into existing_booking
  from public."SessionBooking" booking
  where booking."trainingSessionId" = p_session_id
    and booking."clientId" = p_client_id
  for update;
  if found and existing_booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST') then
    raise exception 'This client is already assigned to the session.' using errcode = '23505';
  end if;

  if session_record."type" = 'PRIVATE' then
    select *
    into active_booking
    from public."SessionBooking" booking
    where booking."trainingSessionId" = p_session_id
      and booking."clientId" <> p_client_id
      and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST')
    order by booking."bookedAt"
    limit 1
    for update;
    if found then
      update public."SessionBooking" booking
      set
        "status" = 'CANCELED',
        "attendedAt" = null,
        "canceledAt" = current_timestamp
      where booking."id" = active_booking."id";
    end if;
  else
    select count(*)
    into seated_count
    from public."SessionBooking" booking
    where booking."trainingSessionId" = p_session_id
      and booking."status" in ('BOOKED', 'ATTENDED');
    if session_record."capacity" is not null
       and seated_count >= session_record."capacity" then
      select settings."overbookWaitlist"
      into waitlist_enabled
      from public."StudioSettings" settings
      where settings."id" = 'default';
      if coalesce(waitlist_enabled, false) then
        next_status := 'WAITLIST'::public."BookingStatus";
      else
        raise exception 'This session is already at capacity.' using errcode = '22023';
      end if;
    end if;
  end if;

  if existing_booking."id" is not null then
    update public."SessionBooking" booking
    set
      "status" = next_status,
      "source" = 'MANUAL',
      "bookedAt" = current_timestamp,
      "attendedAt" = null,
      "canceledAt" = null
    where booking."id" = existing_booking."id"
    returning * into saved_booking;
  else
    insert into public."SessionBooking" (
      "trainingSessionId",
      "clientId",
      "status",
      "source"
    ) values (
      p_session_id,
      p_client_id,
      next_status,
      'MANUAL'
    )
    returning * into saved_booking;
  end if;

  return jsonb_build_object(
    'id', saved_booking."id",
    'status', saved_booking."status"
  );
end;
$$;

create or replace function public.save_admin_group(
  p_group_id text,
  p_name text,
  p_type public."GroupType",
  p_training_category public."TrainingCategory",
  p_coach_id text,
  p_capacity integer,
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
  member_count integer;
begin
  if not exists (
    select 1 from public."Coach" coach where coach."id" = p_coach_id
  ) then
    raise exception 'Coach record not found.' using errcode = 'P0002';
  end if;
  if p_capacity is not null and p_capacity < 1 then
    raise exception 'Group capacity must be greater than zero.' using errcode = '22023';
  end if;

  if nullif(p_group_id, '') is null then
    insert into public."Group" (
      "name", "type", "trainingCategory", "coachId", "capacity", "isActive", "notes"
    ) values (
      trim(p_name), p_type, p_training_category, p_coach_id,
      case when p_type = 'PRIVATE' then 1 else p_capacity end,
      p_is_active, nullif(trim(p_notes), '')
    ) returning "id" into target_group_id;
  else
    perform 1
    from public."Group" studio_group
    where studio_group."id" = p_group_id
    for update;
    if not found then
      raise exception 'Group record not found.' using errcode = 'P0002';
    end if;
    select count(*)
    into member_count
    from public."Client" client
    where client."groupId" = p_group_id;
    if (case when p_type = 'PRIVATE' then 1 else p_capacity end) is not null
       and member_count > (case when p_type = 'PRIVATE' then 1 else p_capacity end) then
      raise exception 'Group capacity cannot be lower than current membership.' using errcode = '22023';
    end if;
    update public."Group" studio_group
    set
      "name" = trim(p_name),
      "type" = p_type,
      "trainingCategory" = p_training_category,
      "coachId" = p_coach_id,
      "capacity" = case when p_type = 'PRIVATE' then 1 else p_capacity end,
      "isActive" = p_is_active,
      "notes" = nullif(trim(p_notes), '')
    where studio_group."id" = p_group_id;
    target_group_id := p_group_id;
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
declare
  group_capacity integer;
  current_members integer;
begin
  select studio_group."capacity"
  into group_capacity
  from public."Group" studio_group
  where studio_group."id" = p_group_id
  for update;
  if not found then
    raise exception 'Group record not found.' using errcode = 'P0002';
  end if;

  perform 1
  from public."Client" client
  where client."id" = p_client_id
  for update;
  if not found then
    raise exception 'Client record not found.' using errcode = 'P0002';
  end if;

  if p_action = 'add' then
    if exists (
      select 1 from public."Client" client
      where client."id" = p_client_id and client."groupId" = p_group_id
    ) then
      return;
    end if;
    select count(*)
    into current_members
    from public."Client" client
    where client."groupId" = p_group_id;
    if group_capacity is not null and current_members >= group_capacity then
      raise exception 'Group is already at capacity.' using errcode = '22023';
    end if;
    update public."Client" client
    set "groupId" = p_group_id
    where client."id" = p_client_id;
  elsif p_action = 'remove' then
    update public."Client" client
    set "groupId" = null
    where client."id" = p_client_id
      and client."groupId" = p_group_id;
  else
    raise exception 'Invalid group membership action.' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.book_client_into_session(text, text)
from public, anon, authenticated;
revoke all on function public.save_admin_group(
  text, text, public."GroupType", public."TrainingCategory", text, integer, boolean, text
) from public, anon, authenticated;
revoke all on function public.set_admin_group_membership(text, text, text)
from public, anon, authenticated;
grant execute on function public.book_client_into_session(text, text)
to service_role;
grant execute on function public.save_admin_group(
  text, text, public."GroupType", public."TrainingCategory", text, integer, boolean, text
) to service_role;
grant execute on function public.set_admin_group_membership(text, text, text)
to service_role;
