-- update_session_attendance declares `returns table (id text)`, so unqualified
-- "id" references inside the body are ambiguous between the out column and the
-- table columns (SQLSTATE 42702). Qualify every reference, matching the fix
-- pattern from 20260718161000_fix_schedule_rpc_column_ambiguity.
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
  select * into target_booking from public."SessionBooking" booking
  where booking."trainingSessionId" = p_training_session_id and booking."clientId" = p_client_id
  for update;
  if target_booking."id" is null then raise exception 'Booking record not found.' using errcode = 'P0002'; end if;

  select * into target_session from public."TrainingSession" training_session
  where training_session."id" = p_training_session_id for share;
  if target_session."status" = 'CANCELED' then raise exception 'Attendance cannot be updated for canceled sessions.' using errcode = 'P0001'; end if;
  if target_booking."status" = 'CANCELED' then raise exception 'Attendance cannot be updated for canceled bookings.' using errcode = 'P0001'; end if;
  if p_status = 'WAITLIST' and target_session."type" = 'PRIVATE' then raise exception 'Private sessions cannot place a client on the waitlist.' using errcode = 'P0001'; end if;

  update public."SessionBooking" booking set
    "status" = p_status,
    "attendedAt" = case when p_status = 'ATTENDED' then current_timestamp else null end,
    "canceledAt" = null
  where booking."id" = target_booking."id";

  for subscription_record in
    select * from public."ClientSubscription" subscription
    where subscription."clientId" = p_client_id
      and target_session."startsAt" >= subscription."startsAt"
      and (coalesce(subscription."renewsAt", subscription."endsAt") is null or target_session."startsAt" <= coalesce(subscription."renewsAt", subscription."endsAt"))
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
    update public."ClientSubscription" subscription set "sessionsUsed" = used_count where subscription."id" = subscription_record."id";
  end loop;

  return query select target_booking."id";
end;
$$;
