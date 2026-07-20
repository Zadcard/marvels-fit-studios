-- Round out lead intake fields for the redesigned Leads & Trials workflow:
-- interested training category, preferred availability, and an optional
-- reason captured when a lead is marked lost. Source stays free text (the
-- public landing page and admin intake already write different source
-- strings); the admin UI constrains its own dropdown to the requested list.
alter table public."Lead"
  add column if not exists "interestedCategory" public."TrainingCategory",
  add column if not exists "preferredAvailability" text,
  add column if not exists "lostReason" text;

comment on column public."Lead"."interestedCategory" is
  'Training category the lead is interested in, shown on the Leads & Trials board.';
comment on column public."Lead"."preferredAvailability" is
  'Free-text note on when the lead is available for a trial.';
comment on column public."Lead"."lostReason" is
  'Optional reason captured when a lead is marked lost (status = CLOSED).';

-- The "Subscribe" step (trial attended -> paid membership) needs the new
-- client's id to attach a subscription, group, and payment. Re-run the
-- existing promotion body and add clientId to the returned payload instead
-- of duplicating the promotion logic.
create or replace function public.promote_lead_to_client(target_lead_id text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  target_lead public."Lead"%rowtype;
  target_user public."User"%rowtype;
  target_client public."Client"%rowtype;
  normalized_email text;
  had_existing_user boolean := false;
  had_existing_client boolean := false;
  new_client_id text;
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
      "trainingCategory" = coalesce(target_lead."interestedCategory", "trainingCategory"),
      "updatedAt" = now()
    where id = target_client.id;

    update public."Lead"
    set status = 'CONVERTED', "updatedAt" = now()
    where id = target_lead.id;

    return jsonb_build_object(
      'outcome', 'promoted',
      'existingUser', true,
      'clientId', target_client.id
    );
  end if;

  if not had_existing_user then
    insert into public."User" (
      email,
      name,
      "mustChangePassword",
      role
    )
    values (
      normalized_email,
      target_lead."fullName",
      false,
      'CLIENT'
    )
    returning * into target_user;
  else
    update public."User"
    set
      name = coalesce(name, target_lead."fullName"),
      email = coalesce(email, normalized_email),
      "updatedAt" = now()
    where id = target_user.id
    returning * into target_user;
  end if;

  insert into public."Client" ("fullName", phone, "userId", "groupId", "trainingCategory")
  values (
    target_lead."fullName",
    target_lead.phone,
    target_user.id,
    target_lead."trialGroupId",
    coalesce(target_lead."interestedCategory", 'GENERAL_FITNESS')
  )
  returning id into new_client_id;

  update public."Lead"
  set status = 'CONVERTED', "updatedAt" = now()
  where id = target_lead.id;

  return jsonb_build_object(
    'outcome', 'promoted',
    'existingUser', had_existing_user,
    'clientId', new_client_id
  );
end;
$function$;

revoke all on function public.promote_lead_to_client(text) from public, anon, authenticated;
grant execute on function public.promote_lead_to_client(text) to service_role;

-- "Lost" needs to work even for leads that never reached TRIAL_DONE (e.g. a
-- no-show that won't be rescheduled, or contact that went cold). Any
-- non-converted lead can be closed with an optional reason.
create or replace function public.close_lead_as_lost(target_lead_id text, target_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public."Lead"
  set status = 'CLOSED', "lostReason" = nullif(trim(target_reason), ''), "updatedAt" = now()
  where id = target_lead_id and status <> 'CONVERTED';

  if not found then
    raise exception 'This lead is already converted or was not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.close_lead_as_lost(text, text) from public, anon, authenticated;
grant execute on function public.close_lead_as_lost(text, text) to service_role;
