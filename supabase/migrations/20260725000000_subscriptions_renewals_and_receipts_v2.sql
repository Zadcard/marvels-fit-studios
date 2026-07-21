-- Subscriptions, Renewals, Payments & Receipts v2
-- 1. Add UPCOMING and QUEUED enum values to SubscriptionStatus.
-- 2. Add snapshot JSONB column to Receipt table for durable historical snapshots.
-- 3. Support early renewal queuing without erasing active time/sessions.
-- 4. Enhance status reconciliation to activate upcoming/queued subscriptions when start conditions are met.

alter type public."SubscriptionStatus" add value if not exists 'UPCOMING';
alter type public."SubscriptionStatus" add value if not exists 'QUEUED';

alter table public."Receipt"
  add column if not exists "snapshot" jsonb;

comment on column public."Receipt"."snapshot" is
  'Historical snapshot of transaction metadata (client, plan, coach, group, payment specs) at time of recording.';

-- Index for fast lookup by client ID and receipt number
create index if not exists "Receipt_client_created_idx" on public."Receipt" ("clientId", "createdAt" desc);
create index if not exists "Receipt_number_idx" on public."Receipt" ("receiptNumber");

-- Function to generate durable receipt snapshot JSON
create or replace function public.build_receipt_snapshot(
  p_ledger_entry_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  l_entry public."BillingLedgerEntry"%rowtype;
  l_client public."Client"%rowtype;
  l_sub public."ClientSubscription"%rowtype;
  l_payment public."Payment"%rowtype;
  l_plan public."SubscriptionPlan"%rowtype;
  l_group public."Group"%rowtype;
  l_coach public."Coach"%rowtype;
  l_creator public."User"%rowtype;
  l_snapshot jsonb;
begin
  select * into l_entry from public."BillingLedgerEntry" where id = p_ledger_entry_id;
  if not found then return null; end if;

  select * into l_client from public."Client" where id = l_entry."clientId";
  if l_entry."clientSubscriptionId" is not null then
    select * into l_sub from public."ClientSubscription" where id = l_entry."clientSubscriptionId";
    if l_sub."planId" is not null then
      select * into l_plan from public."SubscriptionPlan" where id = l_sub."planId";
    end if;
  end if;

  if l_entry."paymentId" is not null then
    select * into l_payment from public."Payment" where id = l_entry."paymentId";
  end if;

  if l_client."groupId" is not null then
    select * into l_group from public."Group" where id = l_client."groupId";
    if l_group."coachId" is not null then
      select * into l_coach from public."Coach" where id = l_group."coachId";
    end if;
  end if;

  if l_entry."createdById" is not null then
    select * into l_creator from public."User" where id = l_entry."createdById";
  end if;

  l_snapshot := jsonb_build_object(
    'receiptNumber', l_entry."receiptNumber",
    'clientId', l_entry."clientId",
    'clientName', coalesce(l_client."fullName", 'Client'),
    'clientPhone', l_client."phone",
    'subscriptionId', l_entry."clientSubscriptionId",
    'paymentId', l_entry."paymentId",
    'amount', l_entry.amount,
    'currency', l_entry.currency,
    'paymentMethod', coalesce(l_payment.method, 'CASH'),
    'paymentDate', l_entry."occurredAt",
    'planName', coalesce(l_plan.name, 'Membership'),
    'planType', case when l_plan."billingCycle" = 'WEEKLY' then 'Weekly Coaching' else 'Group Membership' end,
    'billingCycle', coalesce(l_plan."billingCycle", 'MONTHLY'),
    'durationMonths', coalesce(l_sub."cycleMonths", 1),
    'sessionsIncluded', coalesce(l_sub."sessionsTotal", l_plan."sessionsIncluded", 12),
    'startsAt', l_sub."startsAt",
    'endsAt', l_sub."renewsAt",
    'coachId', case when l_coach.id is not null then l_coach.id else null end,
    'coachName', case when l_coach."fullName" is not null then l_coach."fullName" else null end,
    'groupId', case when l_group.id is not null then l_group.id else null end,
    'groupName', case when l_group.name is not null then l_group.name else null end,
    'createdById', case when l_creator.id is not null then l_creator.id else null end,
    'createdByName', case when l_creator.name is not null then l_creator.name else null end,
    'createdAt', l_entry."createdAt",
    'paymentStatus', 'PAID',
    'note', l_entry.description
  );

  return l_snapshot;
end;
$$;

revoke all on function public.build_receipt_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.build_receipt_snapshot(uuid) to service_role;

-- Automatically populate Receipt table when BillingLedgerEntry is inserted
create or replace function public.auto_create_receipt_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  l_snapshot jsonb;
begin
  l_snapshot := public.build_receipt_snapshot(new.id);
  insert into public."Receipt" (
    "billingLedgerEntryId",
    "receiptNumber",
    "clientId",
    "content",
    "snapshot",
    "createdAt",
    "updatedAt"
  ) values (
    new.id,
    new."receiptNumber",
    new."clientId",
    '',
    l_snapshot,
    new."createdAt",
    now()
  ) on conflict ("billingLedgerEntryId") do update
    set "snapshot" = excluded."snapshot", "updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists "BillingLedgerEntry_auto_receipt" on public."BillingLedgerEntry";
create trigger "BillingLedgerEntry_auto_receipt"
after insert on public."BillingLedgerEntry"
for each row execute function public.auto_create_receipt_record();

-- Backfill missing Receipts with snapshots
insert into public."Receipt" ("billingLedgerEntryId", "receiptNumber", "clientId", "content", "snapshot")
select
  ble.id,
  ble."receiptNumber",
  ble."clientId",
  '',
  public.build_receipt_snapshot(ble.id)
from public."BillingLedgerEntry" ble
on conflict ("billingLedgerEntryId") do update
  set "snapshot" = excluded."snapshot";

-- Reconcile subscription status:
--   1. Activate UPCOMING time-based subscriptions when startsAt <= now()
--   2. Activate QUEUED session subscriptions when active sub reaches 0 sessions or expires
--   3. Reset quarterly session windows
create or replace function public.reconcile_subscription_session_windows()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
  up_rec record;
begin
  -- 1. Activate UPCOMING subscriptions whose start date has arrived
  for up_rec in
    select s.*
    from public."ClientSubscription" s
    where s.status = 'UPCOMING' and s."startsAt" <= now()
    for update
  loop
    -- Expire previous ACTIVE subscriptions for this client+plan
    update public."ClientSubscription"
    set status = 'EXPIRED', "endsAt" = up_rec."startsAt", "updatedAt" = now()
    where "clientId" = up_rec."clientId"
      and "planId" = up_rec."planId"
      and status = 'ACTIVE'
      and id <> up_rec.id;

    -- Activate the upcoming subscription
    update public."ClientSubscription"
    set status = 'ACTIVE', "updatedAt" = now()
    where id = up_rec.id;

    -- Update client sessions left and paid status
    update public."Client"
    set "isPaid" = true,
        "paymentStatus" = 'PAID',
        "sessionsLeft" = coalesce(up_rec."sessionsTotal", "sessionsLeft"),
        "updatedAt" = now()
    where id = up_rec."clientId";
  end loop;

  -- 2. Activate QUEUED session subscriptions when active subscription has 0 remaining sessions or is expired
  for up_rec in
    select s.*
    from public."ClientSubscription" s
    where s.status = 'QUEUED'
    order by s."startsAt" asc
    for update
  loop
    -- Check if client has no active subscription or active sub has 0 sessions
    if not exists (
      select 1 from public."ClientSubscription" active_sub
      where active_sub."clientId" = up_rec."clientId"
        and active_sub."planId" = up_rec."planId"
        and active_sub.status = 'ACTIVE'
        and active_sub.id <> up_rec.id
    ) then
      update public."ClientSubscription" set status = 'ACTIVE', "startsAt" = now(), "updatedAt" = now() where id = up_rec.id;
      update public."Client" set "isPaid" = true, "paymentStatus" = 'PAID', "sessionsLeft" = coalesce(up_rec."sessionsTotal", "sessionsLeft"), "updatedAt" = now() where id = up_rec."clientId";
    end if;
  end loop;

  -- 3. Reset quarterly session allowances
  for rec in
    select id, "clientId", "sessionsTotal", "nextSessionResetAt"
    from public."ClientSubscription"
    where status = 'ACTIVE'
      and "nextSessionResetAt" is not null
      and "nextSessionResetAt" <= now()
      and ("renewsAt" is null or "nextSessionResetAt" < "renewsAt")
    for update
  loop
    update public."ClientSubscription"
    set
      "startsAt" = rec."nextSessionResetAt",
      "sessionsUsed" = 0,
      "nextSessionResetAt" = rec."nextSessionResetAt" + interval '1 month',
      "updatedAt" = now()
    where id = rec.id;

    update public."Client"
    set "sessionsLeft" = coalesce(rec."sessionsTotal", "sessionsLeft"), "updatedAt" = now()
    where id = rec."clientId";
  end loop;
end;
$$;

-- Refactor admin_mutate_subscription function for correct early renewal scheduling
drop function if exists public.admin_mutate_subscription(text, text, text, numeric, integer, integer);
drop function if exists public.admin_mutate_subscription(text, text, text, numeric, integer, integer, text);

create function public.admin_mutate_subscription(
  target_id text,
  target_action text,
  target_payment_method text,
  target_amount numeric default null,
  target_sessions_per_month integer default null,
  target_duration_months integer default null,
  target_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public."ClientSubscription"%rowtype;
  plan public."SubscriptionPlan"%rowtype;
  latest_sub public."ClientSubscription"%rowtype;
  new_starts_at timestamptz;
  next_renewal timestamptz;
  next_session_reset timestamptz;
  amount numeric;
  sessions_total integer;
  duration_months integer;
  new_sub_id text;
  new_status text;
  is_early_renewal boolean := false;
begin
  select * into item from public."ClientSubscription" where id = target_id for update;
  if not found then raise exception 'Subscription not found.'; end if;

  select * into plan from public."SubscriptionPlan" where id = item."planId";
  amount := coalesce(item."customPrice", plan.price);

  if target_action = 'pause' then
    if item.status = 'CANCELED' then raise exception 'Canceled subscriptions cannot be paused.'; end if;
    if item.status = 'PAUSED' then raise exception 'This subscription is already paused.'; end if;
    update public."ClientSubscription" set status = 'PAUSED', "endsAt" = coalesce("renewsAt", now()), "isAutoRenew" = false, "updatedAt" = now() where id = target_id;
    return jsonb_build_object('status', 'PAUSED', 'renewsAt', item."renewsAt", 'paymentStatus', 'Manual review');

  elsif target_action = 'resume' then
    if item.status = 'CANCELED' then raise exception 'Canceled subscriptions cannot be resumed.'; end if;
    if item.status not in ('PAUSED', 'EXPIRED') then raise exception 'Only paused subscriptions can be resumed.'; end if;
    next_renewal := greatest(coalesce(item."renewsAt", now()), now()) +
      case when plan."billingCycle" = 'WEEKLY' then interval '7 days' else make_interval(months => greatest(1, item."cycleMonths")) end;
    update public."ClientSubscription" set status = 'ACTIVE', "endsAt" = null, "renewsAt" = next_renewal, "isAutoRenew" = true, "updatedAt" = now() where id = target_id;
    update public."Client" set "isPaid" = false, "paymentStatus" = 'DUE_SOON', "updatedAt" = now() where id = item."clientId";
    return jsonb_build_object('status', 'ACTIVE', 'renewsAt', next_renewal, 'paymentStatus', 'Due soon');

  elsif target_action = 'cancel' then
    if item.status = 'CANCELED' then raise exception 'Canceled subscriptions cannot be canceled.'; end if;
    update public."ClientSubscription" set status = 'CANCELED', "endsAt" = now(), "renewsAt" = null, "isAutoRenew" = false, "updatedAt" = now() where id = target_id;
    update public."Client" set "isPaid" = false, "paymentStatus" = 'UNPAID', "updatedAt" = now() where id = item."clientId";
    return jsonb_build_object('status', 'CANCELED', 'renewsAt', null, 'paymentStatus', 'Manual review');

  elsif target_action = 'renew' then
    if item.status = 'CANCELED' then raise exception 'Canceled subscriptions cannot be renewed.'; end if;
    if target_payment_method not in ('INSTA_PAY', 'VISA', 'CASH') then
      raise exception 'Choose a valid payment method before renewing.';
    end if;
    if target_amount is not null and target_amount <= 0 then
      raise exception 'Enter a valid renewal amount.';
    end if;
    if target_sessions_per_month is not null and target_sessions_per_month not in (8, 12, 16, 20) then
      raise exception 'Sessions per month must be 8, 12, 16, or 20.';
    end if;
    if target_duration_months is not null and target_duration_months not in (1, 3) then
      raise exception 'Duration must be one month or a quarter.';
    end if;

    amount := coalesce(target_amount, amount);
    sessions_total := coalesce(target_sessions_per_month, item."sessionsTotal");
    duration_months := coalesce(target_duration_months, greatest(1, item."cycleMonths"));

    -- Find the latest active or upcoming subscription for this client+plan to chain dates
    select * into latest_sub
    from public."ClientSubscription"
    where "clientId" = item."clientId"
      and "planId" = item."planId"
      and status in ('ACTIVE', 'UPCOMING', 'QUEUED')
    order by coalesce("renewsAt", "startsAt") desc
    limit 1;

    if found and latest_sub."renewsAt" is not null and latest_sub."renewsAt" > now() then
      is_early_renewal := true;
      new_starts_at := latest_sub."renewsAt";
      new_status := 'UPCOMING';
    else
      is_early_renewal := false;
      new_starts_at := now();
      new_status := 'ACTIVE';
    end if;

    next_renewal := new_starts_at +
      case when plan."billingCycle" = 'WEEKLY' then interval '7 days' else make_interval(months => duration_months) end;

    next_session_reset := case
      when plan."billingCycle" <> 'WEEKLY' and duration_months > 1 then new_starts_at + interval '1 month'
      else null
    end;

    -- If NOT early renewal, mark current subscription as EXPIRED
    if not is_early_renewal then
      update public."ClientSubscription"
      set status = 'EXPIRED', "endsAt" = new_starts_at, "renewsAt" = null, "nextSessionResetAt" = null, "isAutoRenew" = false, "updatedAt" = now()
      where id = item.id;
    end if;

    -- Insert the new subscription (ACTIVE or UPCOMING)
    insert into public."ClientSubscription" (
      "clientId", "planId", status, "startsAt", "renewsAt", "customPrice",
      "sessionsTotal", "sessionsUsed", "isAutoRenew", "cycleMonths", "nextSessionResetAt"
    ) values (
      item."clientId", item."planId", new_status, new_starts_at, next_renewal,
      amount, sessions_total, 0, true, duration_months, next_session_reset
    ) returning id into new_sub_id;

    -- If active immediately, update Client status and session allowance
    if not is_early_renewal then
      update public."Client"
      set "isPaid" = true, "paymentStatus" = 'PAID', "sessionsLeft" = coalesce(sessions_total, "sessionsLeft"), "updatedAt" = now()
      where id = item."clientId";
    end if;

    -- Record Payment (triggers BillingLedgerEntry and auto Receipt creation with snapshot)
    insert into public."Payment" (
      amount, currency, "method", note, "clientId", "clientSubscriptionId"
    ) values (
      amount, plan.currency, target_payment_method,
      coalesce(nullif(trim(target_note), ''), case when is_early_renewal then 'Early renewal payment recorded.' else 'Renewed from admin subscriptions dashboard.' end),
      item."clientId", new_sub_id
    );

    return jsonb_build_object(
      'status', new_status,
      'renewsAt', next_renewal,
      'startsAt', new_starts_at,
      'paymentStatus', 'Paid',
      'subscriptionId', new_sub_id,
      'paymentMethod', target_payment_method,
      'amount', amount,
      'sessionsTotal', sessions_total,
      'cycleMonths', duration_months,
      'isEarlyRenewal', is_early_renewal
    );
  end if;

  raise exception 'Invalid subscription action.';
end;
$$;

revoke all on function public.admin_mutate_subscription(text, text, text, numeric, integer, integer, text) from public, anon, authenticated;
grant execute on function public.admin_mutate_subscription(text, text, text, numeric, integer, integer, text) to service_role;
