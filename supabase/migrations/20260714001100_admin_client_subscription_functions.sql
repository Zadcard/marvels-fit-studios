create or replace function public.admin_save_client(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_client public."Client"%rowtype;
  target_user_id uuid;
  target_client_id uuid;
  latest_subscription_id uuid;
begin
  if nullif(payload->>'clientId', '') is not null then
    select * into target_client from public."Client" where id = (payload->>'clientId')::uuid;
    if not found then raise exception 'Client not found.'; end if;
    if nullif(payload->>'email', '') is not null and exists (
      select 1 from public."User" where email = lower(payload->>'email') and id <> target_client."userId"
    ) then raise exception 'Another user already uses this email.'; end if;

    update public."User" set name = payload->>'fullName', email = nullif(lower(payload->>'email'), ''), "updatedAt" = now()
      where id = target_client."userId";
    update public."Client" set "fullName" = payload->>'fullName', phone = nullif(payload->>'phone', ''),
      "groupId" = nullif(payload->>'groupId', '')::uuid,
      "isPaid" = (payload->>'paymentStatus') = 'PAID',
      "paymentStatus" = (payload->>'paymentStatus')::public."ClientPaymentStatus",
      status = (payload->>'status')::public."ClientLifecycleStatus", "updatedAt" = now()
      where id = target_client.id;
    target_client_id := target_client.id;
  else
    if nullif(payload->>'email', '') is not null and exists (
      select 1 from public."User" where email = lower(payload->>'email')
    ) then raise exception 'A user with this email already exists. Use a different email.'; end if;
    insert into public."User" (name, email, "clientId", password, "mustChangePassword", role)
      values (payload->>'fullName', nullif(lower(payload->>'email'), ''), payload->>'loginClientId', payload->>'password', false, 'CLIENT')
      returning id into target_user_id;
    insert into public."Client" ("fullName", phone, "groupId", status, "isPaid", "paymentStatus", "userId")
      values (payload->>'fullName', nullif(payload->>'phone', ''), nullif(payload->>'groupId', '')::uuid,
        (payload->>'status')::public."ClientLifecycleStatus", (payload->>'paymentStatus') = 'PAID',
        (payload->>'paymentStatus')::public."ClientPaymentStatus", target_user_id)
      returning id into target_client_id;
  end if;

  if (payload->>'paymentStatus') = 'PAID' then
    if coalesce((payload->>'amount')::numeric, 0) <= 0 then
      raise exception 'Enter a valid payment amount before marking the client paid.';
    end if;
    select id into latest_subscription_id from public."ClientSubscription"
      where "clientId" = target_client_id order by "startsAt" desc limit 1;
    insert into public."Payment" (amount, currency, note, "clientId", "clientSubscriptionId")
      values ((payload->>'amount')::numeric, 'EGP',
        case when nullif(payload->>'clientId', '') is null then 'Initial payment recorded from the admin client editor.' else 'Marked paid from the admin client editor.' end,
        target_client_id, latest_subscription_id);
  end if;
  return target_client_id;
end;
$$;

create or replace function public.admin_delete_client(target_client_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target_user_id uuid;
begin
  select "userId" into target_user_id from public."Client" where id = target_client_id;
  if not found then raise exception 'Client not found.'; end if;
  delete from public."SessionBooking" where "clientId" = target_client_id;
  delete from public."Payment" where "clientId" = target_client_id;
  delete from public."ClientSubscription" where "clientId" = target_client_id;
  delete from public."File" where "clientId" = target_client_id;
  delete from public."WorkoutNote" where "clientId" = target_client_id;
  delete from public."SessionCompensation" where "clientId" = target_client_id;
  delete from public."ClientPreferences" where "clientId" = target_client_id;
  delete from public."Client" where id = target_client_id;
  delete from public."User" where id = target_user_id;
end;
$$;

create or replace function public.admin_save_subscription(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target_id uuid; target_plan public."SubscriptionPlan"%rowtype; payment_id uuid;
begin
  if exists (select 1 from public."ClientSubscription" where "clientId"=(payload->>'clientId')::uuid
    and "planId"=(payload->>'planId')::uuid and id <> coalesce(nullif(payload->>'subscriptionId','')::uuid, '00000000-0000-0000-0000-000000000000')) then
    raise exception 'This client already has that subscription plan.';
  end if;
  select * into target_plan from public."SubscriptionPlan" where id=(payload->>'planId')::uuid;
  if not found then raise exception 'Subscription plan not found.'; end if;
  target_id := nullif(payload->>'subscriptionId','')::uuid;
  if target_id is null then
    insert into public."ClientSubscription" ("clientId","planId",status,"startsAt","renewsAt","endsAt","sessionsTotal","isAutoRenew","customPrice")
      values ((payload->>'clientId')::uuid,(payload->>'planId')::uuid,(payload->>'status')::public."SubscriptionStatus",now(),
        (payload->>'renewsAt')::timestamptz,case when payload->>'status'='PAUSED' then (payload->>'renewsAt')::timestamptz end,
        target_plan."sessionsIncluded",payload->>'status'<>'PAUSED',(payload->>'amount')::numeric) returning id into target_id;
  else
    update public."ClientSubscription" set "clientId"=(payload->>'clientId')::uuid,"planId"=(payload->>'planId')::uuid,
      status=(payload->>'status')::public."SubscriptionStatus","renewsAt"=(payload->>'renewsAt')::timestamptz,
      "endsAt"=case when payload->>'status'='PAUSED' then (payload->>'renewsAt')::timestamptz end,
      "sessionsTotal"=target_plan."sessionsIncluded","isAutoRenew"=payload->>'status'<>'PAUSED',"customPrice"=(payload->>'amount')::numeric,"updatedAt"=now()
      where id=target_id;
    if not found then raise exception 'Subscription not found.'; end if;
  end if;
  update public."Client" set "isPaid"=(payload->>'paymentStatus')='PAID',"paymentStatus"=(payload->>'paymentStatus')::public."ClientPaymentStatus","updatedAt"=now()
    where id=(payload->>'clientId')::uuid;
  if payload->>'paymentStatus'='PAID' then
    select id into payment_id from public."Payment" where "clientSubscriptionId"=target_id order by "createdAt" desc limit 1;
    if payment_id is null then
      insert into public."Payment" (amount,currency,note,"clientId","clientSubscriptionId") values ((payload->>'amount')::numeric,'EGP','Saved from the admin subscriptions dashboard.',(payload->>'clientId')::uuid,target_id);
    else
      update public."Payment" set amount=(payload->>'amount')::numeric,currency='EGP',note='Updated from the admin subscriptions dashboard.',date=now() where id=payment_id;
      delete from public."Payment" where "clientSubscriptionId"=target_id and id<>payment_id;
    end if;
  end if;
  return jsonb_build_object('id',target_id,'clientId',payload->>'clientId','planId',payload->>'planId','renewsAt',payload->>'renewsAt','amount',(payload->>'amount')::numeric);
end;
$$;

create or replace function public.admin_mutate_subscription(target_id uuid, target_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item public."ClientSubscription"%rowtype; plan public."SubscriptionPlan"%rowtype; next_renewal timestamptz; cycle_days int; amount numeric;
begin
  select * into item from public."ClientSubscription" where id=target_id;
  if not found then raise exception 'Subscription not found.'; end if;
  select * into plan from public."SubscriptionPlan" where id=item."planId";
  amount := coalesce(item."customPrice",plan.price);
  cycle_days := case plan."billingCycle" when 'WEEKLY' then 7 when 'MONTHLY' then 30 else greatest(1,coalesce(extract(day from (coalesce(item."renewsAt",item."endsAt")-item."startsAt"))::int,30)) end;
  next_renewal := greatest(coalesce(item."renewsAt",now()),now()) + make_interval(days=>cycle_days);
  if target_action='pause' then
    if item.status='CANCELED' then raise exception 'Canceled subscriptions cannot be paused.'; end if;
    if item.status='PAUSED' then raise exception 'This subscription is already paused.'; end if;
    update public."ClientSubscription" set status='PAUSED',"endsAt"=coalesce("renewsAt",now()),"isAutoRenew"=false,"updatedAt"=now() where id=target_id;
    return jsonb_build_object('status','PAUSED','renewsAt',item."renewsAt",'paymentStatus','Manual review');
  elsif target_action='resume' then
    if item.status='CANCELED' then raise exception 'Canceled subscriptions cannot be resumed.'; end if;
    if item.status not in ('PAUSED','EXPIRED') then raise exception 'Only paused subscriptions can be resumed.'; end if;
    update public."ClientSubscription" set status='ACTIVE',"endsAt"=null,"renewsAt"=next_renewal,"isAutoRenew"=true,"updatedAt"=now() where id=target_id;
    update public."Client" set "isPaid"=false,"paymentStatus"='DUE_SOON',"updatedAt"=now() where id=item."clientId";
    return jsonb_build_object('status','ACTIVE','renewsAt',next_renewal,'paymentStatus','Due soon');
  elsif target_action='cancel' then
    if item.status='CANCELED' then raise exception 'This subscription is already canceled.'; end if;
    update public."ClientSubscription" set status='CANCELED',"endsAt"=now(),"renewsAt"=null,"isAutoRenew"=false,"updatedAt"=now() where id=target_id;
    update public."Client" set "isPaid"=false,"paymentStatus"='UNPAID',"updatedAt"=now() where id=item."clientId";
    return jsonb_build_object('status','CANCELED','renewsAt',null,'paymentStatus','Manual review');
  elsif target_action='renew' then
    if item.status='CANCELED' then raise exception 'Canceled subscriptions cannot be renewed.'; end if;
    update public."ClientSubscription" set status='ACTIVE',"endsAt"=null,"renewsAt"=next_renewal,"sessionsUsed"=0,"isAutoRenew"=true,"updatedAt"=now() where id=target_id;
    update public."Client" set "isPaid"=true,"paymentStatus"='PAID',"updatedAt"=now() where id=item."clientId";
    insert into public."Payment" (amount,currency,note,"clientId","clientSubscriptionId") values (amount,plan.currency,'Renewed from the admin subscriptions dashboard.',item."clientId",target_id);
    return jsonb_build_object('status','ACTIVE','renewsAt',next_renewal,'paymentStatus','Paid');
  end if;
  raise exception 'Invalid subscription action.';
end;
$$;

revoke all on function public.admin_save_client(jsonb) from public, anon, authenticated;
revoke all on function public.admin_delete_client(uuid) from public, anon, authenticated;
revoke all on function public.admin_save_subscription(jsonb) from public, anon, authenticated;
revoke all on function public.admin_mutate_subscription(uuid,text) from public, anon, authenticated;
grant execute on function public.admin_save_client(jsonb) to service_role;
grant execute on function public.admin_delete_client(uuid) to service_role;
grant execute on function public.admin_save_subscription(jsonb) to service_role;
grant execute on function public.admin_mutate_subscription(uuid,text) to service_role;
