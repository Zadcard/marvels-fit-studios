create or replace function public.update_session_attendance(
  p_training_session_id text,
  p_client_id text,
  p_status public."BookingStatus"
)
returns table (id text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_booking public."SessionBooking"%rowtype;
  target_session public."TrainingSession"%rowtype;
  subscription_record public."ClientSubscription"%rowtype;
  used_count integer;
begin
  select * into target_booking from public."SessionBooking"
  where "trainingSessionId" = p_training_session_id and "clientId" = p_client_id
  for update;
  if target_booking."id" is null then raise exception 'Booking record not found.' using errcode = 'P0002'; end if;

  select * into target_session from public."TrainingSession"
  where "id" = p_training_session_id for share;
  if target_session."status" = 'CANCELED' then raise exception 'Attendance cannot be updated for canceled sessions.' using errcode = 'P0001'; end if;
  if target_booking."status" = 'CANCELED' then raise exception 'Attendance cannot be updated for canceled bookings.' using errcode = 'P0001'; end if;
  if p_status = 'WAITLIST' and target_session."type" = 'PRIVATE' then raise exception 'Private sessions cannot place a client on the waitlist.' using errcode = 'P0001'; end if;

  update public."SessionBooking" set
    "status" = p_status,
    "attendedAt" = case when p_status = 'ATTENDED' then current_timestamp else null end,
    "canceledAt" = null
  where "id" = target_booking."id";

  for subscription_record in
    select * from public."ClientSubscription"
    where "clientId" = p_client_id
      and target_session."startsAt" >= "startsAt"
      and (coalesce("renewsAt", "endsAt") is null or target_session."startsAt" <= coalesce("renewsAt", "endsAt"))
  loop
    select count(*) into used_count
    from public."SessionBooking" booking
    join public."TrainingSession" session on session."id" = booking."trainingSessionId"
    where booking."clientId" = p_client_id
      and booking."status" = 'ATTENDED'
      and session."status" <> 'CANCELED'
      and session."startsAt" >= subscription_record."startsAt"
      and (coalesce(subscription_record."renewsAt", subscription_record."endsAt") is null
        or session."startsAt" <= coalesce(subscription_record."renewsAt", subscription_record."endsAt"));
    update public."ClientSubscription" set "sessionsUsed" = used_count where "id" = subscription_record."id";
  end loop;

  return query select target_booking."id";
end;
$$;

revoke all on function public.update_session_attendance(text,text,public."BookingStatus") from public,anon,authenticated;
grant execute on function public.update_session_attendance(text,text,public."BookingStatus") to service_role;
