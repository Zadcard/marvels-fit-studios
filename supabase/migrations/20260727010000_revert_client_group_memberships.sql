-- Reverts 20260727000000_client_group_memberships.sql. That migration
-- replaced the single Client.groupId column with a GroupMembership join
-- table to support multi-group clients, but the feature was abandoned
-- before shipping. This restores the single-group model: Client.groupId
-- comes back (backfilled from GroupMembership, which only ever held one
-- row per client in practice), the affected RPCs go back to their
-- pre-multi-group bodies, and GroupMembership is dropped.

begin;

alter table public."Client" add column "groupId" text;

update public."Client" client
set "groupId" = membership."groupId"
from (
  select distinct on ("clientId") "clientId", "groupId"
  from public."GroupMembership"
  order by "clientId", "createdAt"
) membership
where membership."clientId" = client."id";

alter table public."Client"
  add constraint "Client_groupId_fkey" foreign key ("groupId")
  references public."Group"("id") on delete set null on update cascade;

create index "Client_groupId_idx" on public."Client" ("groupId");

drop function if exists public.sync_client_group_memberships(text, text[]);

create or replace function public.admin_save_client(payload jsonb)
 returns text
 language plpgsql
 security definer
 set search_path to ''
as $function$
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
        nullif(payload->>'trainingCategory', '')::public."LegacyTrainingCategory",
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
      "mustChangePassword",
      role
    )
    values (
      payload->>'fullName',
      nullif(lower(payload->>'email'), ''),
      false,
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
        nullif(payload->>'trainingCategory', '')::public."LegacyTrainingCategory",
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
$function$;

create or replace function public.register_client(p_full_name text, p_phone text, p_email text, p_group_id text)
 returns table("userId" text)
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  created_user_id text;
begin
  insert into public."User" (
    "name", "email", "mustChangePassword", "role"
  ) values (
    p_full_name, nullif(p_email, ''), false, 'CLIENT'
  )
  returning "id" into created_user_id;

  insert into public."Client" (
    "userId", "fullName", "phone", "groupId", "status"
  ) values (
    created_user_id, p_full_name, p_phone, nullif(p_group_id, ''), 'ACTIVE'
  );

  return query select created_user_id;
end;
$function$;

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

create or replace function public.decide_schedule_change_request(p_request_id uuid, p_decision text, p_decided_by_id text)
 returns text
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  request_record public."ScheduleChangeRequest"%rowtype;
  occurrence record;
  failures text[] := '{}';
  summary text := null;
  to_group_capacity integer;
  to_group_member_count integer;
begin
  if p_decision not in ('APPROVED', 'DECLINED') then
    raise exception 'Unknown decision.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public."User" staff_user
    where staff_user."id" = p_decided_by_id and staff_user."role" = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;

  select * into request_record
  from public."ScheduleChangeRequest" request
  where request."id" = p_request_id
  for update;
  if not found then
    raise exception 'Change request not found.' using errcode = 'P0002';
  end if;
  if request_record."status" <> 'PENDING' then
    raise exception 'This request was already decided.' using errcode = '22023';
  end if;

  if p_decision = 'APPROVED' then
    if request_record."kind" = 'CANCEL_OCCURRENCE' then
      update public."SessionBooking" booking
      set "status" = 'CANCELED', "attendedAt" = null, "canceledAt" = current_timestamp
      where booking."trainingSessionId" = request_record."sourceSessionId"
        and booking."clientId" = request_record."clientId"
        and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST');

    elsif request_record."kind" = 'MOVE_OCCURRENCE' then
      update public."SessionBooking" booking
      set "status" = 'CANCELED', "attendedAt" = null, "canceledAt" = current_timestamp
      where booking."trainingSessionId" = request_record."sourceSessionId"
        and booking."clientId" = request_record."clientId"
        and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
      perform public.book_client_into_session(
        request_record."targetSessionId", request_record."clientId"
      );

    elsif request_record."kind" = 'RECURRING_WEEKDAYS' then
      for occurrence in
        select training_session."id", training_session."startsAt"
        from public."TrainingSession" training_session
        where training_session."groupId" = request_record."groupId"
          and training_session."status" in ('DRAFT', 'SCHEDULED')
          and training_session."startsAt" > now()
          and (training_session."startsAt" at time zone 'Africa/Cairo')::date >= request_record."effectiveFrom"
          and extract(dow from training_session."startsAt" at time zone 'Africa/Cairo')::integer
            = any(request_record."fromWeekdays")
      loop
        update public."SessionBooking" booking
        set "status" = 'CANCELED', "attendedAt" = null, "canceledAt" = current_timestamp
        where booking."trainingSessionId" = occurrence."id"
          and booking."clientId" = request_record."clientId"
          and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
      end loop;

      for occurrence in
        select training_session."id", training_session."startsAt"
        from public."TrainingSession" training_session
        where training_session."groupId" = request_record."groupId"
          and training_session."status" in ('DRAFT', 'SCHEDULED')
          and training_session."startsAt" > now()
          and (training_session."startsAt" at time zone 'Africa/Cairo')::date >= request_record."effectiveFrom"
          and extract(dow from training_session."startsAt" at time zone 'Africa/Cairo')::integer
            = any(request_record."toWeekdays")
        order by training_session."startsAt"
      loop
        begin
          perform public.book_client_into_session(occurrence."id", request_record."clientId");
        exception
          when sqlstate '23505' then
            null;
          when others then
            failures := array_append(
              failures,
              to_char(occurrence."startsAt" at time zone 'Africa/Cairo', 'Dy DD Mon') || ' — ' || sqlerrm
            );
        end;
      end loop;

      if array_length(failures, 1) > 0 then
        summary := array_to_string(failures, '; ');
      end if;

    elsif request_record."kind" = 'PERMANENT_GROUP_CHANGE' then
      perform 1 from public."Client" client where client."id" = request_record."clientId" for update;

      for occurrence in
        select training_session."id"
        from public."TrainingSession" training_session
        where training_session."groupId" = request_record."groupId"
          and training_session."status" in ('DRAFT', 'SCHEDULED')
          and training_session."startsAt" > now()
          and (training_session."startsAt" at time zone 'Africa/Cairo')::date >= request_record."effectiveFrom"
      loop
        update public."SessionBooking" booking
        set "status" = 'CANCELED', "attendedAt" = null, "canceledAt" = current_timestamp
        where booking."trainingSessionId" = occurrence."id"
          and booking."clientId" = request_record."clientId"
          and booking."status" in ('BOOKED', 'ATTENDED', 'WAITLIST');
      end loop;

      update public."Client"
      set "groupId" = request_record."toGroupId"
      where "id" = request_record."clientId";

      for occurrence in
        select training_session."id", training_session."startsAt"
        from public."TrainingSession" training_session
        where training_session."groupId" = request_record."toGroupId"
          and training_session."status" in ('DRAFT', 'SCHEDULED')
          and training_session."startsAt" > now()
          and (training_session."startsAt" at time zone 'Africa/Cairo')::date >= request_record."effectiveFrom"
        order by training_session."startsAt"
      loop
        begin
          perform public.book_client_into_session(occurrence."id", request_record."clientId");
        exception
          when sqlstate '23505' then
            null;
          when others then
            failures := array_append(
              failures,
              to_char(occurrence."startsAt" at time zone 'Africa/Cairo', 'Dy DD Mon') || ' — ' || sqlerrm
            );
        end;
      end loop;

      if array_length(failures, 1) > 0 then
        summary := array_to_string(failures, '; ');
      end if;
    end if;
  end if;

  update public."ScheduleChangeRequest"
  set
    "status" = p_decision,
    "decidedById" = p_decided_by_id,
    "decidedAt" = current_timestamp,
    "resultSummary" = summary
  where "id" = p_request_id;

  return summary;
end;
$function$;

create or replace function public.set_admin_group_membership(p_group_id text, p_client_id text, p_action text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  perform 1 from public."Group" where "id" = p_group_id for update;
  if not found then
    raise exception 'Group record not found.' using errcode = 'P0002';
  end if;
  perform 1 from public."Client" where "id" = p_client_id for update;
  if not found then
    raise exception 'Client record not found.' using errcode = 'P0002';
  end if;
  if p_action = 'add' then
    update public."Client" set "groupId" = p_group_id where "id" = p_client_id;
  elsif p_action = 'remove' then
    update public."Client" set "groupId" = null
    where "id" = p_client_id and "groupId" = p_group_id;
  else
    raise exception 'Invalid group membership action.' using errcode = '22023';
  end if;
end;
$function$;

revoke all on function public.admin_save_client(jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_client(jsonb) to service_role;

revoke all on function public.register_client(text, text, text, text) from public, anon, authenticated;
grant execute on function public.register_client(text, text, text, text) to service_role;

revoke all on function public.promote_lead_to_client(text) from public, anon, authenticated;
grant execute on function public.promote_lead_to_client(text) to service_role;

revoke all on function public.decide_schedule_change_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.decide_schedule_change_request(uuid, text, text) to service_role;

revoke all on function public.set_admin_group_membership(text, text, text) from public, anon, authenticated;
grant execute on function public.set_admin_group_membership(text, text, text) to service_role;

drop table public."GroupMembership";

commit;
