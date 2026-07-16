-- Phase 3 (client lifecycle + trials): model Marvel's real client journey.
--
-- Lifecycle statuses gain TRIAL, INACTIVE and DID_NOT_CONTINUE so the roster can
-- express the full journey: Lead -> Trial -> Active -> Paused -> Inactive /
-- Did not continue. A TrialOutcome captures what happened after a free trial.
--
-- Additive and non-destructive: enum values are appended and the new Client
-- column is nullable, so existing rows and code keep working.

-- Lifecycle statuses ----------------------------------------------------------
alter type "ClientLifecycleStatus" add value if not exists 'TRIAL';
alter type "ClientLifecycleStatus" add value if not exists 'INACTIVE';
alter type "ClientLifecycleStatus" add value if not exists 'DID_NOT_CONTINUE';

-- Trial outcome ---------------------------------------------------------------
create type "TrialOutcome" as enum (
  'SUBSCRIBED',
  'FOLLOW_UP',
  'DID_NOT_CONTINUE',
  'NO_RESPONSE',
  'NO_SHOW',
  'NEEDS_DIFFERENT_OPTION'
);

alter table "Client"
  add column "trialOutcome" "TrialOutcome";

-- admin_save_client: persist the trial outcome alongside the client record. The
-- status column already accepts any lifecycle value via its cast, so no change
-- is needed there for the new statuses.
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
      status = (payload->>'status')::public."ClientLifecycleStatus",
      "trainingCategory" = coalesce(nullif(payload->>'trainingCategory', '')::public."TrainingCategory", target_client."trainingCategory"),
      "sport" = case when payload ? 'sport' then nullif(payload->>'sport', '') else target_client."sport" end,
      "injuryStatus" = coalesce(nullif(payload->>'injuryStatus', '')::public."InjuryStatus", target_client."injuryStatus"),
      "injuryNotes" = case when payload ? 'injuryNotes' then nullif(payload->>'injuryNotes', '') else target_client."injuryNotes" end,
      "restrictions" = case when payload ? 'restrictions' then nullif(payload->>'restrictions', '') else target_client."restrictions" end,
      "trialOutcome" = case when payload ? 'trialOutcome' then nullif(payload->>'trialOutcome', '')::public."TrialOutcome" else target_client."trialOutcome" end,
      "updatedAt" = now()
      where id = target_client.id;
    target_client_id := target_client.id;
  else
    if nullif(payload->>'email', '') is not null and exists (
      select 1 from public."User" where email = lower(payload->>'email')
    ) then raise exception 'A user with this email already exists. Use a different email.'; end if;
    insert into public."User" (name, email, "clientId", password, "mustChangePassword", role)
      values (payload->>'fullName', nullif(lower(payload->>'email'), ''), payload->>'loginClientId', payload->>'password', false, 'CLIENT')
      returning id into target_user_id;
    insert into public."Client" ("fullName", phone, "groupId", status, "isPaid", "paymentStatus",
        "trainingCategory", "sport", "injuryStatus", "injuryNotes", "restrictions", "trialOutcome", "userId")
      values (payload->>'fullName', nullif(payload->>'phone', ''), nullif(payload->>'groupId', '')::uuid,
        (payload->>'status')::public."ClientLifecycleStatus", (payload->>'paymentStatus') = 'PAID',
        (payload->>'paymentStatus')::public."ClientPaymentStatus",
        coalesce(nullif(payload->>'trainingCategory', '')::public."TrainingCategory", 'GENERAL_FITNESS'),
        nullif(payload->>'sport', ''),
        coalesce(nullif(payload->>'injuryStatus', '')::public."InjuryStatus", 'NONE'),
        nullif(payload->>'injuryNotes', ''),
        nullif(payload->>'restrictions', ''),
        nullif(payload->>'trialOutcome', '')::public."TrialOutcome",
        target_user_id)
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
