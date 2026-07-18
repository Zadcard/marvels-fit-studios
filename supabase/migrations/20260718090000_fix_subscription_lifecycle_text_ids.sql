-- Subscription identifiers are text throughout the schema. The previous
-- lifecycle RPC accepted uuid, which made real subscription actions reject
-- valid IDs before the function body could run.
drop function if exists public.admin_mutate_subscription(uuid, text);

create function public.admin_mutate_subscription(target_id text, target_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item public."ClientSubscription"%rowtype;
  plan public."SubscriptionPlan"%rowtype;
  next_renewal timestamptz;
  cycle_days int;
  amount numeric;
  new_sub_id text;
begin
  select * into item from public."ClientSubscription" where id = target_id;
  if not found then raise exception 'Subscription not found.'; end if;

  select * into plan from public."SubscriptionPlan" where id = item."planId";
  amount := coalesce(item."customPrice", plan.price);
  cycle_days := case plan."billingCycle"
    when 'WEEKLY' then 7
    when 'MONTHLY' then 30
    else greatest(1, coalesce(extract(day from (coalesce(item."renewsAt", item."endsAt") - item."startsAt"))::int, 30))
  end;
  next_renewal := greatest(coalesce(item."renewsAt", now()), now()) + make_interval(days => cycle_days);

  if target_action = 'pause' then
    if item.status = 'CANCELED' then raise exception 'Canceled subscriptions cannot be paused.'; end if;
    if item.status = 'PAUSED' then raise exception 'This subscription is already paused.'; end if;
    update public."ClientSubscription" set status = 'PAUSED', "endsAt" = coalesce("renewsAt", now()), "isAutoRenew" = false, "updatedAt" = now() where id = target_id;
    return jsonb_build_object('status', 'PAUSED', 'renewsAt', item."renewsAt", 'paymentStatus', 'Manual review');
  elsif target_action = 'resume' then
    if item.status = 'CANCELED' then raise exception 'Canceled subscriptions cannot be resumed.'; end if;
    if item.status not in ('PAUSED', 'EXPIRED') then raise exception 'Only paused subscriptions can be resumed.'; end if;
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
    update public."ClientSubscription" set status = 'EXPIRED', "endsAt" = now(), "renewsAt" = null, "isAutoRenew" = false, "updatedAt" = now() where id = target_id;
    insert into public."ClientSubscription" ("clientId", "planId", status, "startsAt", "renewsAt", "customPrice", "sessionsTotal", "sessionsUsed", "isAutoRenew")
      values (item."clientId", item."planId", 'ACTIVE', now(), next_renewal, item."customPrice", item."sessionsTotal", 0, true)
      returning id into new_sub_id;
    update public."Client" set "isPaid" = true, "paymentStatus" = 'PAID', "updatedAt" = now() where id = item."clientId";
    insert into public."Payment" (amount, currency, note, "clientId", "clientSubscriptionId")
      values (amount, plan.currency, 'Renewed from the admin subscriptions dashboard.', item."clientId", new_sub_id);
    return jsonb_build_object('status', 'ACTIVE', 'renewsAt', next_renewal, 'paymentStatus', 'Paid', 'subscriptionId', new_sub_id);
  end if;

  raise exception 'Invalid subscription action.';
end;
$$;

revoke all on function public.admin_mutate_subscription(text, text) from public, anon, authenticated;
grant execute on function public.admin_mutate_subscription(text, text) to service_role;
