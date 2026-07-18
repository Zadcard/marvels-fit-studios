-- Keep the client roster lifecycle aligned with the current subscription
-- lifecycle. Lead trials remain prospect workflow rows; the Today dashboard
-- reads those from Lead rather than mixing them with enrolled Client rows.

create or replace function public.reconcile_client_subscription_lifecycle(
  target_client_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_subscription_status public."SubscriptionStatus";
  current_client_status public."ClientLifecycleStatus";
begin
  select client.status
  into current_client_status
  from public."Client" client
  where client.id = target_client_id
  for update;

  if not found then
    return;
  end if;

  select subscription.status
  into current_subscription_status
  from public."ClientSubscription" subscription
  where subscription."clientId" = target_client_id
    and subscription.status in ('ACTIVE', 'TRIAL', 'PAUSED')
  order by
    case subscription.status
      when 'ACTIVE' then 1
      when 'TRIAL' then 2
      else 3
    end,
    subscription."startsAt" desc,
    subscription."createdAt" desc
  limit 1;

  if current_subscription_status = 'ACTIVE' then
    update public."Client"
    set
      status = 'ACTIVE',
      "trialOutcome" = case
        when current_client_status = 'TRIAL' then 'SUBSCRIBED'
        else "trialOutcome"
      end,
      "updatedAt" = now()
    where id = target_client_id
      and (
        status is distinct from 'ACTIVE'
        or (current_client_status = 'TRIAL' and "trialOutcome" is distinct from 'SUBSCRIBED')
      );
  elsif current_subscription_status = 'TRIAL' then
    update public."Client"
    set status = 'TRIAL', "updatedAt" = now()
    where id = target_client_id
      and status is distinct from 'TRIAL';
  elsif current_subscription_status = 'PAUSED' then
    update public."Client"
    set status = 'PAUSED', "updatedAt" = now()
    where id = target_client_id
      and status is distinct from 'PAUSED';
  elsif current_client_status in ('ACTIVE', 'TRIAL', 'PAUSED')
    and exists (
      select 1
      from public."ClientSubscription" subscription
      where subscription."clientId" = target_client_id
    ) then
    update public."Client"
    set status = 'INACTIVE', "updatedAt" = now()
    where id = target_client_id;
  end if;
end;
$$;

create or replace function public.sync_client_subscription_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.reconcile_client_subscription_lifecycle(old."clientId");
    return old;
  end if;

  if tg_op = 'UPDATE' and old."clientId" is distinct from new."clientId" then
    perform public.reconcile_client_subscription_lifecycle(old."clientId");
  end if;

  perform public.reconcile_client_subscription_lifecycle(new."clientId");
  return new;
end;
$$;

drop trigger if exists "ClientSubscription_sync_client_lifecycle"
  on public."ClientSubscription";

create trigger "ClientSubscription_sync_client_lifecycle"
after insert or update of status, "clientId" or delete
on public."ClientSubscription"
for each row
execute function public.sync_client_subscription_lifecycle();

revoke all on function public.reconcile_client_subscription_lifecycle(text)
  from public, anon, authenticated;
revoke all on function public.sync_client_subscription_lifecycle()
  from public, anon, authenticated;
grant execute on function public.reconcile_client_subscription_lifecycle(text)
  to service_role;

-- Deterministically reconcile existing subscription-backed client rows.
do $$
declare
  client_record record;
begin
  for client_record in
    select distinct subscription."clientId"
    from public."ClientSubscription" subscription
  loop
    perform public.reconcile_client_subscription_lifecycle(client_record."clientId");
  end loop;
end;
$$;
