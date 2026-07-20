-- Quarterly plans grant a session allowance that resets every month, not once
-- for the whole quarter. ClientSubscription rows track a single paid period
-- (matching the existing renewal-history design), so track the monthly
-- reset separately from the period's true end ("renewsAt"/"endsAt").
alter table public."ClientSubscription"
  add column if not exists "cycleMonths" integer not null default 1,
  add column if not exists "nextSessionResetAt" timestamptz;

comment on column public."ClientSubscription"."cycleMonths" is
  'Billed duration in months (1 = monthly, 3 = quarterly). Drives renewal cadence.';
comment on column public."ClientSubscription"."nextSessionResetAt" is
  'Next time the monthly session allowance resets within this paid period. Null when the period itself is monthly (renewsAt already does the job).';

-- Lazily reset the monthly session allowance for subscriptions whose reset
-- date has passed but whose paid period (renewsAt) has not ended yet. Safe to
-- call on every dashboard read: the WHERE clause limits work to rows that are
-- actually due, so it is a cheap no-op most of the time. This avoids relying
-- on pg_cron (not configured for this project) while still giving quarterly
-- clients a fresh per-month allowance.
create or replace function public.reconcile_subscription_session_windows()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec record;
begin
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

revoke all on function public.reconcile_subscription_session_windows() from public, anon, authenticated;
grant execute on function public.reconcile_subscription_session_windows() to service_role;

-- Fix admin_mutate_subscription's 'renew' action:
--   - Renewing before the current period ends must start the new period
--     right after the current one ends (the client keeps their remaining
--     paid days instead of losing them).
--   - Renewing an already-expired subscription starts on the chosen
--     activation date (today, since there is no separate date picker yet).
--   - Carries cycleMonths/nextSessionResetAt forward so quarterly renewals
--     keep resetting their session allowance monthly.
drop function if exists public.admin_mutate_subscription(text, text, text);

create function public.admin_mutate_subscription(
  target_id text,
  target_action text,
  target_payment_method text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item public."ClientSubscription"%rowtype;
  plan public."SubscriptionPlan"%rowtype;
  new_starts_at timestamptz;
  next_renewal timestamptz;
  next_session_reset timestamptz;
  amount numeric;
  new_sub_id text;
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

    -- Renewed before expiry: keep the remaining paid days by starting after
    -- the current period ends. Renewed after expiry: start today.
    new_starts_at := case
      when item."renewsAt" is not null and item."renewsAt" > now() then item."renewsAt"
      else now()
    end;
    next_renewal := new_starts_at +
      case when plan."billingCycle" = 'WEEKLY' then interval '7 days' else make_interval(months => greatest(1, item."cycleMonths")) end;
    next_session_reset := case
      when plan."billingCycle" <> 'WEEKLY' and item."cycleMonths" > 1 then new_starts_at + interval '1 month'
      else null
    end;

    update public."ClientSubscription" set status = 'EXPIRED', "endsAt" = new_starts_at, "renewsAt" = null, "nextSessionResetAt" = null, "isAutoRenew" = false, "updatedAt" = now() where id = target_id;
    insert into public."ClientSubscription" ("clientId", "planId", status, "startsAt", "renewsAt", "customPrice", "sessionsTotal", "sessionsUsed", "isAutoRenew", "cycleMonths", "nextSessionResetAt")
      values (item."clientId", item."planId", 'ACTIVE', new_starts_at, next_renewal, item."customPrice", item."sessionsTotal", 0, true, greatest(1, item."cycleMonths"), next_session_reset)
      returning id into new_sub_id;
    update public."Client" set "isPaid" = true, "paymentStatus" = 'PAID', "sessionsLeft" = coalesce(item."sessionsTotal", "sessionsLeft"), "updatedAt" = now() where id = item."clientId";
    insert into public."Payment" (amount, currency, "method", note, "clientId", "clientSubscriptionId")
      values (amount, plan.currency, target_payment_method, 'Renewed from the admin subscriptions dashboard.', item."clientId", new_sub_id);
    return jsonb_build_object('status', 'ACTIVE', 'renewsAt', next_renewal, 'startsAt', new_starts_at, 'paymentStatus', 'Paid', 'subscriptionId', new_sub_id, 'paymentMethod', target_payment_method);
  end if;

  raise exception 'Invalid subscription action.';
end;
$$;

revoke all on function public.admin_mutate_subscription(text, text, text) from public, anon, authenticated;
grant execute on function public.admin_mutate_subscription(text, text, text) to service_role;
