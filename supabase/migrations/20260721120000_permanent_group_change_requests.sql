-- Adds a third client-request kind, PERMANENT_GROUP_CHANGE, to the
-- ScheduleChangeRequest workflow introduced in 20260718150104: a client
-- permanently moves from one group to another (as opposed to
-- MOVE_OCCURRENCE, which only swaps a single session). Reuses the existing
-- "groupId" column as the FROM group (same overload precedent as
-- sourceSessionId/targetSessionId already being kind-specific) and adds
-- "toGroupId" for the destination. Approval flips Client.groupId
-- immediately (there is no membership-period table to schedule a future
-- flip against — see save_admin_group/set_admin_group_membership, which
-- are already immediate/single-column); "effectiveFrom" bounds which
-- session occurrences get canceled on the old group and best-effort
-- rebooked on the new one, mirroring RECURRING_WEEKDAYS.
--
-- Also hardens MOVE_OCCURRENCE at log time: the target session must still
-- be active and in the future, and its group's training category must
-- match the source session's group's training category.

comment on column public."ScheduleChangeRequest"."groupId" is
  'FROM group for RECURRING_WEEKDAYS and PERMANENT_GROUP_CHANGE (kind-specific overload, see column comments on sourceSessionId/targetSessionId for precedent).';

alter table public."ScheduleChangeRequest"
  add column "toGroupId" text references public."Group"("id") on delete cascade;

comment on column public."ScheduleChangeRequest"."toGroupId" is
  'TO group for PERMANENT_GROUP_CHANGE only.';

alter table public."ScheduleChangeRequest"
  drop constraint "ScheduleChangeRequest_kind_fields_check";

alter table public."ScheduleChangeRequest"
  add constraint "ScheduleChangeRequest_kind_fields_check" check (
    ("kind" = 'CANCEL_OCCURRENCE' and "sourceSessionId" is not null
      and "targetSessionId" is null and "groupId" is null and "toGroupId" is null
      and "fromWeekdays" is null and "toWeekdays" is null and "effectiveFrom" is null)
    or
    ("kind" = 'MOVE_OCCURRENCE' and "sourceSessionId" is not null and "targetSessionId" is not null
      and "groupId" is null and "toGroupId" is null
      and "fromWeekdays" is null and "toWeekdays" is null and "effectiveFrom" is null)
    or
    ("kind" = 'RECURRING_WEEKDAYS' and "sourceSessionId" is null and "targetSessionId" is null
      and "groupId" is not null and "toGroupId" is null
      and "fromWeekdays" is not null and "toWeekdays" is not null
      and "effectiveFrom" is not null)
    or
    ("kind" = 'PERMANENT_GROUP_CHANGE' and "sourceSessionId" is null and "targetSessionId" is null
      and "groupId" is not null and "toGroupId" is not null and "groupId" <> "toGroupId"
      and "fromWeekdays" is null and "toWeekdays" is null
      and "effectiveFrom" is not null)
  );

alter table public."ScheduleChangeRequest"
  drop constraint "ScheduleChangeRequest_kind_check";

alter table public."ScheduleChangeRequest"
  add constraint "ScheduleChangeRequest_kind_check" check (
    "kind" in ('CANCEL_OCCURRENCE', 'MOVE_OCCURRENCE', 'RECURRING_WEEKDAYS', 'PERMANENT_GROUP_CHANGE')
  );

-- The added trailing parameter changes the function's signature, so
-- create-or-replace below would coexist as an overload rather than
-- replace the original 10-arg function. Drop it explicitly first.
drop function if exists public.log_schedule_change_request(
  text, text, text, text, text, text, text, integer[], integer[], date
);

create or replace function public.log_schedule_change_request(
  p_client_id text,
  p_kind text,
  p_reason text,
  p_created_by_id text,
  p_source_session_id text default null,
  p_target_session_id text default null,
  p_group_id text default null,
  p_from_weekdays integer[] default null,
  p_to_weekdays integer[] default null,
  p_effective_from date default null,
  p_to_group_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
  source_session public."TrainingSession"%rowtype;
  target_session public."TrainingSession"%rowtype;
  source_category public."TrainingCategory";
  target_category public."TrainingCategory";
begin
  if not exists (
    select 1 from public."User" staff_user
    where staff_user."id" = p_created_by_id and staff_user."role" = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public."Client" client where client."id" = p_client_id) then
    raise exception 'Client record not found.' using errcode = 'P0002';
  end if;
  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) > 300 then
    raise exception 'A reason between 2 and 300 characters is required.' using errcode = '22023';
  end if;

  if p_kind = 'CANCEL_OCCURRENCE' then
    if p_source_session_id is null then
      raise exception 'A session is required to cancel a booking.' using errcode = '22023';
    end if;

  elsif p_kind = 'MOVE_OCCURRENCE' then
    if p_source_session_id is null or p_target_session_id is null then
      raise exception 'A source and target session are required to move a booking.' using errcode = '22023';
    end if;

    select * into target_session
    from public."TrainingSession" training_session
    where training_session."id" = p_target_session_id;
    if not found then
      raise exception 'Target session not found.' using errcode = 'P0002';
    end if;
    if target_session."status" in ('CANCELED', 'COMPLETED') or target_session."startsAt" <= now() then
      raise exception 'The target session has already happened or is no longer active.' using errcode = '22023';
    end if;

    select * into source_session
    from public."TrainingSession" training_session
    where training_session."id" = p_source_session_id;
    if found and source_session."groupId" is not null and target_session."groupId" is not null then
      select "trainingCategory" into source_category
      from public."Group" grp where grp."id" = source_session."groupId";
      select "trainingCategory" into target_category
      from public."Group" grp where grp."id" = target_session."groupId";
      if source_category is not null and target_category is not null and source_category <> target_category then
        raise exception 'The target session does not match the source session''s training category.'
          using errcode = '22023';
      end if;
    end if;

  elsif p_kind = 'RECURRING_WEEKDAYS' then
    if p_group_id is null or p_from_weekdays is null or p_to_weekdays is null or p_effective_from is null then
      raise exception 'A group, from/to weekdays, and an effective date are required.' using errcode = '22023';
    end if;

  elsif p_kind = 'PERMANENT_GROUP_CHANGE' then
    if p_group_id is null or p_to_group_id is null or p_effective_from is null then
      raise exception 'A current group, a new group, and an effective date are required.' using errcode = '22023';
    end if;
    if p_group_id = p_to_group_id then
      raise exception 'The new group must be different from the current group.' using errcode = '22023';
    end if;
    if not exists (select 1 from public."Group" grp where grp."id" = p_group_id) then
      raise exception 'Current group not found.' using errcode = 'P0002';
    end if;
    if not exists (select 1 from public."Group" grp where grp."id" = p_to_group_id) then
      raise exception 'New group not found.' using errcode = 'P0002';
    end if;

  else
    raise exception 'Unknown change request kind.' using errcode = '22023';
  end if;

  insert into public."ScheduleChangeRequest" (
    "clientId", "kind", "reason", "createdById",
    "sourceSessionId", "targetSessionId", "groupId",
    "fromWeekdays", "toWeekdays", "effectiveFrom", "toGroupId"
  ) values (
    p_client_id, p_kind, trim(p_reason), p_created_by_id,
    p_source_session_id, p_target_session_id, p_group_id,
    p_from_weekdays, p_to_weekdays, p_effective_from, p_to_group_id
  ) returning "id" into request_id;

  return request_id;
end;
$$;

create or replace function public.decide_schedule_change_request(
  p_request_id uuid,
  p_decision text,
  p_decided_by_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
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

      select "capacity" into to_group_capacity
      from public."Group" grp where grp."id" = request_record."toGroupId" for update;
      if to_group_capacity is not null then
        select count(*) into to_group_member_count
        from public."Client" client
        where client."groupId" = request_record."toGroupId";
        if to_group_member_count >= to_group_capacity then
          raise exception 'The new group is already at capacity.' using errcode = '22023';
        end if;
      end if;

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
$$;

revoke all on function public.log_schedule_change_request(
  text, text, text, text, text, text, text, integer[], integer[], date, text
) from public, anon, authenticated;
grant execute on function public.log_schedule_change_request(
  text, text, text, text, text, text, text, integer[], integer[], date, text
) to service_role;

revoke all on function public.decide_schedule_change_request(uuid, text, text)
from public, anon, authenticated;
grant execute on function public.decide_schedule_change_request(uuid, text, text)
to service_role;
