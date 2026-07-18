create or replace function public.enqueue_studio_notifications(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_count integer := 0;
  affected integer;
begin
  with session_recipients as (
    select
      session."id" as session_id,
      session."title" as session_title,
      session."startsAt" as starts_at,
      coach_user."id" as recipient_id,
      '/coach/sessions?session=' || session."id" as destination
    from public."TrainingSession" session
    join public."Coach" coach on coach."id" = session."coachId"
    join public."User" coach_user on coach_user."id" = coach."userId"
    where session."status" = 'SCHEDULED'
      and (session."startsAt" at time zone 'Africa/Cairo')::date =
        (p_now at time zone 'Africa/Cairo')::date + 1

    union all

    select
      session."id",
      session."title",
      session."startsAt",
      admin_user."id",
      '/admin/schedule'
    from public."TrainingSession" session
    cross join public."User" admin_user
    where session."status" = 'SCHEDULED'
      and admin_user."role" = 'ADMIN'
      and (session."startsAt" at time zone 'Africa/Cairo')::date =
        (p_now at time zone 'Africa/Cairo')::date + 1
  )
  insert into public."Notification" (
    "recipientId", "kind", "title", "body", "href", "dedupeKey", "metadata"
  )
  select
    recipient.recipient_id,
    'SESSION_REMINDER'::public."NotificationKind",
    'Training session tomorrow',
    recipient.session_title || ' starts ' ||
      to_char(recipient.starts_at at time zone 'Africa/Cairo', 'Mon DD at HH12:MI AM') || '.',
    recipient.destination,
    'session:' || recipient.session_id || ':recipient:' || recipient.recipient_id || ':next-day',
    jsonb_build_object('trainingSessionId', recipient.session_id)
  from session_recipients recipient
  on conflict ("dedupeKey") do nothing;
  get diagnostics affected = row_count;
  created_count := created_count + affected;

  insert into public."Notification" (
    "recipientId", "kind", "title", "body", "href", "dedupeKey", "metadata"
  )
  select
    admin_user."id",
    'RENEWAL_REMINDER'::public."NotificationKind",
    'Membership renewal approaching',
    client."fullName" || '''s ' || plan."name" || ' membership renews on ' ||
      to_char(subscription."renewsAt" at time zone 'Africa/Cairo', 'Mon DD, YYYY') || '.',
    '/admin/subscriptions',
    'renewal:' || subscription."id" || ':recipient:' || admin_user."id" || ':' ||
      (subscription."renewsAt" at time zone 'Africa/Cairo')::date::text || ':7d',
    jsonb_build_object(
      'subscriptionId', subscription."id",
      'clientId', subscription."clientId"
    )
  from public."ClientSubscription" subscription
  join public."Client" client on client."id" = subscription."clientId"
  join public."SubscriptionPlan" plan on plan."id" = subscription."planId"
  cross join public."User" admin_user
  where subscription."status" in ('ACTIVE', 'TRIAL')
    and admin_user."role" = 'ADMIN'
    and (subscription."renewsAt" at time zone 'Africa/Cairo')::date =
      (p_now at time zone 'Africa/Cairo')::date + 7
  on conflict ("dedupeKey") do nothing;
  get diagnostics affected = row_count;
  created_count := created_count + affected;

  return created_count;
end;
$$;

create or replace function public.run_studio_notification_automation(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid := gen_random_uuid();
  created_count integer := 0;
  failure_message text;
begin
  update public."AutomationRun"
  set "status" = 'FAILED',
      "errorMessage" = 'Run did not finish before the next automation window.',
      "finishedAt" = now()
  where "jobName" = 'studio-notifications'
    and "status" = 'RUNNING'
    and "startedAt" < now() - interval '2 hours';

  insert into public."AutomationRun" (
    "id", "jobName", "status", "startedAt"
  ) values (
    run_id, 'studio-notifications', 'RUNNING', now()
  );

  begin
    created_count := public.enqueue_studio_notifications(p_now);

    update public."AutomationRun"
    set "status" = 'SUCCEEDED',
        "notificationsCreated" = created_count,
        "finishedAt" = now()
    where "id" = run_id;

    return jsonb_build_object(
      'runId', run_id,
      'status', 'SUCCEEDED',
      'notificationsCreated', created_count
    );
  exception when others then
    failure_message := left(sqlerrm, 1000);
    update public."AutomationRun"
    set "status" = 'FAILED',
        "errorMessage" = failure_message,
        "finishedAt" = now()
    where "id" = run_id;

    return jsonb_build_object(
      'runId', run_id,
      'status', 'FAILED',
      'notificationsCreated', 0
    );
  end;
end;
$$;

revoke all on function public.enqueue_studio_notifications(timestamptz)
  from public, anon, authenticated;
revoke all on function public.run_studio_notification_automation(timestamptz)
  from public, anon, authenticated;
grant execute on function public.enqueue_studio_notifications(timestamptz)
  to service_role;
grant execute on function public.run_studio_notification_automation(timestamptz)
  to service_role;
