-- Restores the "change requests" workflow from the design handoff for
-- real: staff log a client's requested schedule change (on their behalf,
-- there is no client-facing app), an admin approves or declines it, and
-- approval actually mutates bookings through the existing transactional
-- primitives (book_client_into_session for capacity/waitlist handling,
-- direct status updates for cancellation) rather than duplicating that
-- logic here.

create table public."ScheduleChangeRequest" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references public."Client"("id") on delete cascade,
  "kind" text not null check ("kind" in ('CANCEL_OCCURRENCE', 'MOVE_OCCURRENCE', 'RECURRING_WEEKDAYS')),
  "status" text not null default 'PENDING' check ("status" in ('PENDING', 'APPROVED', 'DECLINED')),
  "reason" text not null check (char_length(trim("reason")) between 2 and 300),
  "sourceSessionId" text references public."TrainingSession"("id") on delete cascade,
  "targetSessionId" text references public."TrainingSession"("id") on delete cascade,
  "groupId" text references public."Group"("id") on delete cascade,
  "fromWeekdays" integer[],
  "toWeekdays" integer[],
  "effectiveFrom" date,
  "resultSummary" text,
  "createdById" text not null references public."User"("id") on delete restrict,
  "createdAt" timestamptz not null default now(),
  "decidedById" text references public."User"("id") on delete restrict,
  "decidedAt" timestamptz,
  constraint "ScheduleChangeRequest_kind_fields_check" check (
    ("kind" = 'CANCEL_OCCURRENCE' and "sourceSessionId" is not null
      and "targetSessionId" is null and "groupId" is null
      and "fromWeekdays" is null and "toWeekdays" is null and "effectiveFrom" is null)
    or
    ("kind" = 'MOVE_OCCURRENCE' and "sourceSessionId" is not null and "targetSessionId" is not null
      and "groupId" is null and "fromWeekdays" is null and "toWeekdays" is null and "effectiveFrom" is null)
    or
    ("kind" = 'RECURRING_WEEKDAYS' and "sourceSessionId" is null and "targetSessionId" is null
      and "groupId" is not null and "fromWeekdays" is not null and "toWeekdays" is not null
      and "effectiveFrom" is not null)
  ),
  constraint "ScheduleChangeRequest_decision_audit_check" check (
    ("status" = 'PENDING' and "decidedById" is null and "decidedAt" is null)
    or
    ("status" in ('APPROVED', 'DECLINED') and "decidedById" is not null and "decidedAt" is not null)
  )
);

create index "ScheduleChangeRequest_status_created_idx"
  on public."ScheduleChangeRequest" ("status", "createdAt" desc);
create index "ScheduleChangeRequest_client_idx"
  on public."ScheduleChangeRequest" ("clientId");

alter table public."ScheduleChangeRequest" enable row level security;
revoke all on table public."ScheduleChangeRequest" from anon, authenticated;
grant all on table public."ScheduleChangeRequest" to service_role;

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
  p_effective_from date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
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
  elsif p_kind = 'RECURRING_WEEKDAYS' then
    if p_group_id is null or p_from_weekdays is null or p_to_weekdays is null or p_effective_from is null then
      raise exception 'A group, from/to weekdays, and an effective date are required.' using errcode = '22023';
    end if;
  else
    raise exception 'Unknown change request kind.' using errcode = '22023';
  end if;

  insert into public."ScheduleChangeRequest" (
    "clientId", "kind", "reason", "createdById",
    "sourceSessionId", "targetSessionId", "groupId",
    "fromWeekdays", "toWeekdays", "effectiveFrom"
  ) values (
    p_client_id, p_kind, trim(p_reason), p_created_by_id,
    p_source_session_id, p_target_session_id, p_group_id,
    p_from_weekdays, p_to_weekdays, p_effective_from
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
  text, text, text, text, text, text, text, integer[], integer[], date
) from public, anon, authenticated;
grant execute on function public.log_schedule_change_request(
  text, text, text, text, text, text, text, integer[], integer[], date
) to service_role;

revoke all on function public.decide_schedule_change_request(uuid, text, text)
from public, anon, authenticated;
grant execute on function public.decide_schedule_change_request(uuid, text, text)
to service_role;
