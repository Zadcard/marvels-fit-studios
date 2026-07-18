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
      "trainingSessionId", "clientId", "status", "source"
    ) values (
      p_session_id, p_client_id, next_status, 'MANUAL'
    ) returning * into saved_booking;
  end if;

  return jsonb_build_object(
    'id', saved_booking."id",
    'status', saved_booking."status"
  );
end;
$$;

revoke all on function public.book_client_into_session(text, text)
from public, anon, authenticated;
grant execute on function public.book_client_into_session(text, text)
to service_role;
