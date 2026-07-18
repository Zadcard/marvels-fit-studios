-- Restore text-ID compatibility after later feature migrations recreated these
-- RPCs from older UUID-based definitions. Keep profile edits separate from
-- payment events so a normal edit cannot generate a duplicate charge.

drop function if exists public.admin_save_client(jsonb);

create function public.admin_save_client(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_client public."Client"%rowtype;
  target_user_id text;
  target_client_id text;
  latest_subscription_id text;
  previous_payment_status public."ClientPaymentStatus";
  is_new_client boolean := nullif(payload->>'clientId', '') is null;
  should_record_payment boolean := false;
begin
  if not is_new_client then
    select * into target_client
    from public."Client"
    where id = payload->>'clientId'
    for update;

    if not found then
      raise exception 'Client not found.' using errcode = 'P0002';
    end if;

    previous_payment_status := target_client."paymentStatus";

    if nullif(payload->>'email', '') is not null and exists (
      select 1
      from public."User"
      where email = lower(payload->>'email')
        and id <> target_client."userId"
    ) then
      raise exception 'Another user already uses this email.' using errcode = '23505';
    end if;

    update public."User"
    set
      name = payload->>'fullName',
      email = nullif(lower(payload->>'email'), ''),
      "updatedAt" = now()
    where id = target_client."userId";

    update public."Client"
    set
      "fullName" = payload->>'fullName',
      phone = nullif(payload->>'phone', ''),
      "groupId" = nullif(payload->>'groupId', ''),
      "isPaid" = (payload->>'paymentStatus') = 'PAID',
      "paymentStatus" = (payload->>'paymentStatus')::public."ClientPaymentStatus",
      status = (payload->>'status')::public."ClientLifecycleStatus",
      "trainingCategory" = coalesce(
        nullif(payload->>'trainingCategory', '')::public."TrainingCategory",
        target_client."trainingCategory"
      ),
      sport = case
        when payload ? 'sport' then nullif(payload->>'sport', '')
        else target_client.sport
      end,
      "injuryStatus" = coalesce(
        nullif(payload->>'injuryStatus', '')::public."InjuryStatus",
        target_client."injuryStatus"
      ),
      "injuryNotes" = case
        when payload ? 'injuryNotes' then nullif(payload->>'injuryNotes', '')
        else target_client."injuryNotes"
      end,
      restrictions = case
        when payload ? 'restrictions' then nullif(payload->>'restrictions', '')
        else target_client.restrictions
      end,
      "trialOutcome" = case
        when payload ? 'trialOutcome'
          then nullif(payload->>'trialOutcome', '')::public."TrialOutcome"
        else target_client."trialOutcome"
      end,
      "updatedAt" = now()
    where id = target_client.id;

    target_client_id := target_client.id;
    should_record_payment :=
      (payload->>'paymentStatus') = 'PAID'
      and previous_payment_status is distinct from 'PAID';
  else
    if nullif(payload->>'email', '') is not null and exists (
      select 1 from public."User" where email = lower(payload->>'email')
    ) then
      raise exception 'A user with this email already exists. Use a different email.' using errcode = '23505';
    end if;

    insert into public."User" (
      name,
      email,
      "clientId",
      password,
      "mustChangePassword",
      role
    )
    values (
      payload->>'fullName',
      nullif(lower(payload->>'email'), ''),
      payload->>'loginClientId',
      payload->>'password',
      true,
      'CLIENT'
    )
    returning id into target_user_id;

    insert into public."Client" (
      "fullName",
      phone,
      "groupId",
      status,
      "isPaid",
      "paymentStatus",
      "trainingCategory",
      sport,
      "injuryStatus",
      "injuryNotes",
      restrictions,
      "trialOutcome",
      "userId"
    )
    values (
      payload->>'fullName',
      nullif(payload->>'phone', ''),
      nullif(payload->>'groupId', ''),
      (payload->>'status')::public."ClientLifecycleStatus",
      (payload->>'paymentStatus') = 'PAID',
      (payload->>'paymentStatus')::public."ClientPaymentStatus",
      coalesce(
        nullif(payload->>'trainingCategory', '')::public."TrainingCategory",
        'GENERAL_FITNESS'
      ),
      nullif(payload->>'sport', ''),
      coalesce(
        nullif(payload->>'injuryStatus', '')::public."InjuryStatus",
        'NONE'
      ),
      nullif(payload->>'injuryNotes', ''),
      nullif(payload->>'restrictions', ''),
      nullif(payload->>'trialOutcome', '')::public."TrialOutcome",
      target_user_id
    )
    returning id into target_client_id;

    should_record_payment := (payload->>'paymentStatus') = 'PAID';
  end if;

  if should_record_payment then
    if coalesce((payload->>'amount')::numeric, 0) <= 0 then
      raise exception 'Enter a valid payment amount before marking the client paid.' using errcode = '22023';
    end if;

    select id into latest_subscription_id
    from public."ClientSubscription"
    where "clientId" = target_client_id
    order by "startsAt" desc
    limit 1;

    insert into public."Payment" (
      amount,
      currency,
      note,
      "clientId",
      "clientSubscriptionId"
    )
    values (
      (payload->>'amount')::numeric,
      'EGP',
      case
        when is_new_client then 'Initial payment recorded from the admin client editor.'
        else 'Marked paid from the admin client editor.'
      end,
      target_client_id,
      latest_subscription_id
    );
  end if;

  return target_client_id;
end;
$$;

revoke all on function public.admin_save_client(jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_client(jsonb) to service_role;

drop function if exists public.promote_lead_to_client(uuid, text, text);
drop function if exists public.promote_lead_to_client(text, text, text);

create function public.promote_lead_to_client(
  target_lead_id text,
  generated_client_id text,
  hashed_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_lead public."Lead"%rowtype;
  target_user public."User"%rowtype;
  target_client public."Client"%rowtype;
  normalized_email text;
  had_existing_user boolean := false;
  had_existing_client boolean := false;
begin
  select * into target_lead
  from public."Lead"
  where id = target_lead_id
  for update;

  if not found then
    raise exception 'Lead not found.' using errcode = 'P0002';
  end if;

  if target_lead.status = 'CONVERTED' then
    return jsonb_build_object('outcome', 'skipped', 'reason', 'already_converted');
  end if;

  if target_lead.status <> 'TRIAL_DONE' then
    raise exception 'Only a completed trial can be converted.' using errcode = 'P0001';
  end if;

  normalized_email := nullif(lower(trim(target_lead.email)), '');

  if normalized_email is not null then
    select * into target_user
    from public."User"
    where email = normalized_email
    for update;
    had_existing_user := found;
  end if;

  if had_existing_user and target_user.role <> 'CLIENT' then
    return jsonb_build_object(
      'outcome', 'skipped',
      'reason', 'non_client_account',
      'role', target_user.role
    );
  end if;

  if had_existing_user then
    select * into target_client
    from public."Client"
    where "userId" = target_user.id
    for update;
    had_existing_client := found;
  end if;

  if had_existing_client then
    update public."Client"
    set
      "groupId" = coalesce("groupId", target_lead."trialGroupId"),
      "updatedAt" = now()
    where id = target_client.id;

    update public."Lead"
    set status = 'CONVERTED', "updatedAt" = now()
    where id = target_lead.id;

    return jsonb_build_object(
      'outcome', 'promoted',
      'existingUser', true,
      'credentialsIssued', false,
      'clientId', target_user."clientId"
    );
  end if;

  if not had_existing_user then
    insert into public."User" (
      email,
      name,
      "clientId",
      password,
      "mustChangePassword",
      role
    )
    values (
      normalized_email,
      target_lead."fullName",
      generated_client_id,
      hashed_password,
      true,
      'CLIENT'
    )
    returning * into target_user;
  else
    update public."User"
    set
      name = coalesce(name, target_lead."fullName"),
      email = coalesce(email, normalized_email),
      "clientId" = coalesce("clientId", generated_client_id),
      password = hashed_password,
      "mustChangePassword" = true,
      "updatedAt" = now()
    where id = target_user.id
    returning * into target_user;
  end if;

  insert into public."Client" ("fullName", phone, "userId", "groupId")
  values (
    target_lead."fullName",
    target_lead.phone,
    target_user.id,
    target_lead."trialGroupId"
  );

  update public."Lead"
  set status = 'CONVERTED', "updatedAt" = now()
  where id = target_lead.id;

  return jsonb_build_object(
    'outcome', 'promoted',
    'existingUser', had_existing_user,
    'credentialsIssued', true,
    'clientId', target_user."clientId"
  );
end;
$$;

revoke all on function public.promote_lead_to_client(text, text, text) from public, anon, authenticated;
grant execute on function public.promote_lead_to_client(text, text, text) to service_role;
