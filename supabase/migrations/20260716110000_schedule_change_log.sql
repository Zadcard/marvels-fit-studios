-- Phase 8 (schedule changes): preserve a history of every schedule change.
--
-- A trigger records reschedules (start/end/coach moved) and cancellations on
-- TrainingSession into an append-only log, so admins and coaches can see what
-- changed and when. Implemented entirely in SQL so it captures changes from any
-- path (RPC, direct update, bulk update) without application wiring.

create table "ScheduleChangeLog" (
  "id" uuid primary key default gen_random_uuid(),
  "trainingSessionId" text not null references "TrainingSession"("id") on delete cascade,
  "changeType" text not null check ("changeType" in ('RESCHEDULED', 'CANCELED', 'COACH_CHANGED')),
  "previousStartsAt" timestamptz,
  "newStartsAt" timestamptz,
  "previousEndsAt" timestamptz,
  "newEndsAt" timestamptz,
  "previousCoachId" text,
  "newCoachId" text,
  "previousStatus" "TrainingSessionStatus",
  "newStatus" "TrainingSessionStatus",
  "createdAt" timestamptz not null default now()
);

create index "ScheduleChangeLog_session_created_idx"
  on "ScheduleChangeLog" ("trainingSessionId", "createdAt" desc);

alter table "ScheduleChangeLog" enable row level security;
revoke all on table "ScheduleChangeLog" from anon, authenticated;
grant all on table "ScheduleChangeLog" to service_role;

create or replace function public.log_training_session_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Cancellation.
  if new."status" = 'CANCELED' and old."status" is distinct from 'CANCELED' then
    insert into public."ScheduleChangeLog"
      ("trainingSessionId","changeType","previousStatus","newStatus")
      values (new."id",'CANCELED',old."status",new."status");
  end if;

  -- Time change (reschedule).
  if new."startsAt" is distinct from old."startsAt"
     or new."endsAt" is distinct from old."endsAt" then
    insert into public."ScheduleChangeLog"
      ("trainingSessionId","changeType","previousStartsAt","newStartsAt","previousEndsAt","newEndsAt")
      values (new."id",'RESCHEDULED',old."startsAt",new."startsAt",old."endsAt",new."endsAt");
  end if;

  -- Coach reassignment.
  if new."coachId" is distinct from old."coachId" then
    insert into public."ScheduleChangeLog"
      ("trainingSessionId","changeType","previousCoachId","newCoachId")
      values (new."id",'COACH_CHANGED',old."coachId",new."coachId");
  end if;

  return new;
end;
$$;

create trigger "TrainingSession_log_change"
after update on "TrainingSession"
for each row execute function public.log_training_session_change();
