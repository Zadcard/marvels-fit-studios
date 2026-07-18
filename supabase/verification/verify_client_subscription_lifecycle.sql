begin;

do $$
declare
  test_user_id text := 'verify-user-subscription-lifecycle';
  test_client_id text := 'verify-client-subscription-lifecycle';
  test_plan_id text := 'verify-plan-subscription-lifecycle';
  test_subscription_id text := 'verify-subscription-lifecycle';
  stored_status public."ClientLifecycleStatus";
  stored_outcome public."TrialOutcome";
begin
  insert into public."User" (id, name, email, password, role, "mustChangePassword")
  values (test_user_id, 'Lifecycle verification', 'lifecycle-verification@example.invalid', 'not-used', 'CLIENT', true);

  insert into public."Client" (id, "fullName", "userId", status, "updatedAt")
  values (test_client_id, 'Lifecycle verification', test_user_id, 'TRIAL', now());

  insert into public."SubscriptionPlan" (
    id, name, slug, "billingCycle", price, "updatedAt"
  ) values (
    test_plan_id, 'Lifecycle verification', test_plan_id, 'MONTHLY', 1, now()
  );

  insert into public."ClientSubscription" (
    id, "clientId", "planId", status, "startsAt", "updatedAt"
  ) values (
    test_subscription_id, test_client_id, test_plan_id, 'TRIAL', now(), now()
  );

  select status into stored_status
  from public."Client" where id = test_client_id;
  if stored_status <> 'TRIAL' then
    raise exception 'TRIAL subscription did not keep the client in TRIAL.';
  end if;

  update public."ClientSubscription"
  set status = 'ACTIVE', "updatedAt" = now()
  where id = test_subscription_id;

  select status, "trialOutcome" into stored_status, stored_outcome
  from public."Client" where id = test_client_id;
  if stored_status <> 'ACTIVE' or stored_outcome <> 'SUBSCRIBED' then
    raise exception 'ACTIVE subscription did not promote the client lifecycle.';
  end if;

  update public."ClientSubscription"
  set status = 'PAUSED', "updatedAt" = now()
  where id = test_subscription_id;

  select status into stored_status
  from public."Client" where id = test_client_id;
  if stored_status <> 'PAUSED' then
    raise exception 'PAUSED subscription did not pause the client lifecycle.';
  end if;

  update public."ClientSubscription"
  set status = 'CANCELED', "updatedAt" = now()
  where id = test_subscription_id;

  select status into stored_status
  from public."Client" where id = test_client_id;
  if stored_status <> 'INACTIVE' then
    raise exception 'Terminal subscription did not inactivate the client lifecycle.';
  end if;
end;
$$;

rollback;

select
  (
    select count(*)
    from public."Client" client
    where exists (
      select 1
      from public."ClientSubscription" subscription
      where subscription."clientId" = client.id
        and subscription.status = 'ACTIVE'
    )
    and client.status <> 'ACTIVE'
  ) as active_subscription_client_mismatches,
  (
    select count(*)
    from public."Lead"
    where status = 'TRIAL_DONE'
      and "trialGroupId" is null
  ) as completed_leads_without_group;
