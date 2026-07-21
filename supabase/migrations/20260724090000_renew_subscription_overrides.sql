-- Let the admin override the amount, sessions/month, and duration when
-- renewing a subscription, instead of always carrying the previous period's
-- values forward unchanged. All three are optional: omitting one keeps the
-- previous value, exactly like before this migration.
--
-- Adding parameters changes the function's identity (Postgres overloads by
-- argument type list, not by name/defaults), so the old 3-arg signature must
-- be dropped explicitly or both would coexist and every 3-arg call from the
-- app would become ambiguous.
drop function if exists public.admin_mutate_subscription(text, text, text);

create function public.admin_mutate_subscription(
  target_id text,
  target_action text,
  target_payment_method text,
  target_amount numeric default null,
  target_sessions_per_month integer default null,
  target_duration_months integer default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item public."ClientSubscription"%rowtype;
  plan public."SubscriptionPlan"%rowtype;
  new_starts_at timestamptz;
  next_renewal timestamptz;
  next_session_reset timestamptz;
  amount numeric;
  sessions_total integer;
  duration_months integer;
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

    -- Renewed before expiry: keep the remaining paid days by starting after
    -- the current period ends. Renewed after expiry: start today.
    new_starts_at := case
      when item."renewsAt" is not null and item."renewsAt" > now() then item."renewsAt"
      else now()
    end;
    next_renewal := new_starts_at +
      case when plan."billingCycle" = 'WEEKLY' then interval '7 days' else make_interval(months => duration_months) end;
    next_session_reset := case
      when plan."billingCycle" <> 'WEEKLY' and duration_months > 1 then new_starts_at + interval '1 month'
      else null
    end;

    update public."ClientSubscription" set status = 'EXPIRED', "endsAt" = new_starts_at, "renewsAt" = null, "nextSessionResetAt" = null, "isAutoRenew" = false, "updatedAt" = now() where id = target_id;
    insert into public."ClientSubscription" ("clientId", "planId", status, "startsAt", "renewsAt", "customPrice", "sessionsTotal", "sessionsUsed", "isAutoRenew", "cycleMonths", "nextSessionResetAt")
      values (item."clientId", item."planId", 'ACTIVE', new_starts_at, next_renewal, amount, sessions_total, 0, true, duration_months, next_session_reset)
      returning id into new_sub_id;
    update public."Client" set "isPaid" = true, "paymentStatus" = 'PAID', "sessionsLeft" = coalesce(sessions_total, "sessionsLeft"), "updatedAt" = now() where id = item."clientId";
    insert into public."Payment" (amount, currency, "method", note, "clientId", "clientSubscriptionId")
      values (amount, plan.currency, target_payment_method, 'Renewed from the admin subscriptions dashboard.', item."clientId", new_sub_id);
    return jsonb_build_object('status', 'ACTIVE', 'renewsAt', next_renewal, 'startsAt', new_starts_at, 'paymentStatus', 'Paid', 'subscriptionId', new_sub_id, 'paymentMethod', target_payment_method, 'amount', amount, 'sessionsTotal', sessions_total, 'cycleMonths', duration_months);
  end if;

  raise exception 'Invalid subscription action.';
end;
$$;

revoke all on function public.admin_mutate_subscription(text, text, text, numeric, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_mutate_subscription(text, text, text, numeric, integer, integer) to service_role;
