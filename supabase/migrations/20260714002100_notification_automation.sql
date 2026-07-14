create type "NotificationKind" as enum ('SESSION_REMINDER', 'RENEWAL_REMINDER', 'SYSTEM');
create type "NotificationStatus" as enum ('SENT', 'READ', 'FAILED');

create table "Notification" (
  "id" uuid primary key default gen_random_uuid(),
  "recipientId" text not null references "User"("id") on delete cascade,
  "kind" "NotificationKind" not null,
  "status" "NotificationStatus" not null default 'SENT',
  "title" text not null,
  "body" text not null,
  "href" text,
  "dedupeKey" text not null unique,
  "metadata" jsonb not null default '{}'::jsonb,
  "sentAt" timestamptz not null default now(),
  "readAt" timestamptz,
  "createdAt" timestamptz not null default now()
);

create table "AutomationRun" (
  "id" uuid primary key default gen_random_uuid(),
  "jobName" text not null,
  "status" text not null check ("status" in ('RUNNING', 'SUCCEEDED', 'FAILED')),
  "notificationsCreated" integer not null default 0,
  "errorMessage" text,
  "startedAt" timestamptz not null default now(),
  "finishedAt" timestamptz
);

create index "Notification_recipient_status_created_idx"
  on "Notification" ("recipientId", "status", "createdAt" desc);
create index "AutomationRun_job_started_idx"
  on "AutomationRun" ("jobName", "startedAt" desc);

alter table "Notification" enable row level security;
alter table "AutomationRun" enable row level security;
revoke all on table "Notification" from anon, authenticated;
revoke all on table "AutomationRun" from anon, authenticated;
grant all on table "Notification" to service_role;
grant all on table "AutomationRun" to service_role;

create or replace function public.enqueue_studio_notifications(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_count integer := 0;
  affected integer;
begin
  insert into public."Notification" (
    "recipientId", "kind", "title", "body", "href", "dedupeKey", "metadata"
  )
  select distinct
    client."userId",
    'SESSION_REMINDER'::public."NotificationKind",
    'Training session tomorrow',
    session."title" || ' starts ' || to_char(session."startsAt" at time zone 'Africa/Cairo', 'Mon DD at HH12:MI AM') || '.',
    '/client/sessions',
    'session:' || session."id" || ':client:' || client."userId" || ':24h',
    jsonb_build_object('trainingSessionId', session."id")
  from public."TrainingSession" session
  join public."SessionBooking" booking on booking."trainingSessionId" = session."id"
  join public."Client" client on client."id" = booking."clientId"
  where session."status" = 'SCHEDULED'
    and booking."status" in ('BOOKED', 'WAITLIST')
    and session."startsAt" > p_now + interval '23 hours'
    and session."startsAt" <= p_now + interval '25 hours'
  on conflict ("dedupeKey") do nothing;
  get diagnostics affected = row_count;
  created_count := created_count + affected;

  insert into public."Notification" (
    "recipientId", "kind", "title", "body", "href", "dedupeKey", "metadata"
  )
  select
    client."userId",
    'RENEWAL_REMINDER'::public."NotificationKind",
    'Membership renewal approaching',
    'Your ' || plan."name" || ' membership renews on ' || to_char(subscription."renewsAt" at time zone 'Africa/Cairo', 'Mon DD, YYYY') || '.',
    '/client/subscription',
    'renewal:' || subscription."id" || ':' || subscription."renewsAt"::date::text || ':7d',
    jsonb_build_object('subscriptionId', subscription."id")
  from public."ClientSubscription" subscription
  join public."Client" client on client."id" = subscription."clientId"
  join public."SubscriptionPlan" plan on plan."id" = subscription."planId"
  where subscription."status" in ('ACTIVE', 'TRIAL')
    and subscription."renewsAt" > p_now + interval '6 days 23 hours'
    and subscription."renewsAt" <= p_now + interval '7 days 1 hour'
  on conflict ("dedupeKey") do nothing;
  get diagnostics affected = row_count;
  created_count := created_count + affected;

  return created_count;
end;
$$;

revoke all on function public.enqueue_studio_notifications(timestamptz)
  from public, anon, authenticated;
grant execute on function public.enqueue_studio_notifications(timestamptz)
  to service_role;
