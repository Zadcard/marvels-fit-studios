create or replace function public.update_training_session(
  p_session_id text, p_title text, p_description text,
  p_type public."TrainingSessionType", p_status public."TrainingSessionStatus",
  p_coach_id text, p_location text, p_starts_at timestamptz,
  p_ends_at timestamptz, p_capacity integer
)
returns table (id text)
language plpgsql security definer set search_path = '' as $$
declare current_status public."TrainingSessionStatus"; active_count integer; normalized_capacity integer;
begin
  if not exists (select 1 from public."Coach" where "id" = p_coach_id) then
    raise exception 'Coach record not found.' using errcode = 'P0002';
  end if;
  select "status" into current_status from public."TrainingSession" where "id" = p_session_id for update;
  if current_status is null then raise exception 'Session record not found.' using errcode = 'P0002'; end if;
  if current_status = 'CANCELED' then raise exception 'Canceled sessions cannot be edited.' using errcode = 'P0001'; end if;
  normalized_capacity := case when p_type = 'PRIVATE' then 1 else nullif(p_capacity, -1) end;
  select count(*) into active_count from public."SessionBooking"
    where "trainingSessionId" = p_session_id and "status" in ('BOOKED','ATTENDED','WAITLIST');
  if p_type <> 'PRIVATE' and normalized_capacity is not null and active_count > normalized_capacity then
    raise exception 'Capacity cannot be lower than the current active roster.' using errcode = '22023';
  end if;
  if p_type = 'PRIVATE' and active_count > 1 then
    update public."SessionBooking" set "status" = 'CANCELED', "canceledAt" = current_timestamp
    where "id" in (select "id" from public."SessionBooking"
      where "trainingSessionId" = p_session_id and "status" in ('BOOKED','ATTENDED','WAITLIST')
      order by "bookedAt" asc offset 1);
  end if;
  update public."TrainingSession" set
    "title"=trim(p_title), "description"=nullif(trim(p_description),''), "type"=p_type,
    "status"=p_status, "coachId"=p_coach_id, "location"=nullif(trim(p_location),''),
    "startsAt"=p_starts_at, "endsAt"=p_ends_at, "capacity"=normalized_capacity
  where "id"=p_session_id;
  return query select p_session_id;
end; $$;

create or replace function public.cancel_training_session(p_session_id text)
returns table (id text)
language plpgsql security definer set search_path = '' as $$
declare current_status public."TrainingSessionStatus";
begin
  select "status" into current_status from public."TrainingSession" where "id"=p_session_id for update;
  if current_status is null then raise exception 'Session record not found.' using errcode='P0002'; end if;
  if current_status='COMPLETED' then raise exception 'Completed sessions cannot be canceled.' using errcode='P0001'; end if;
  if current_status <> 'CANCELED' then
    update public."SessionBooking" set "status"='CANCELED', "canceledAt"=current_timestamp
      where "trainingSessionId"=p_session_id and "status" in ('BOOKED','ATTENDED','WAITLIST');
    update public."TrainingSession" set "status"='CANCELED' where "id"=p_session_id;
  end if;
  return query select p_session_id;
end; $$;

create or replace function public.bulk_update_training_sessions(
  p_session_ids text[], p_action text, p_coach_id text, p_location text, p_capacity integer
)
returns integer language plpgsql security definer set search_path = '' as $$
declare found_count integer; session_record record;
begin
  select count(*) into found_count from public."TrainingSession" where "id"=any(p_session_ids);
  if found_count <> cardinality(p_session_ids) then raise exception 'One or more selected sessions were not found.' using errcode='P0002'; end if;
  if p_action='REASSIGN_COACH' then
    if nullif(p_coach_id,'') is null or not exists(select 1 from public."Coach" where "id"=p_coach_id) then raise exception 'Coach record not found.' using errcode='P0002'; end if;
    if exists(select 1 from public."TrainingSession" target join public."TrainingSession" selected
      on selected."id"=any(p_session_ids) and target."startsAt" < selected."endsAt" and target."endsAt" > selected."startsAt"
      where target."coachId"=p_coach_id and target."status" in ('DRAFT','SCHEDULED') and not(target."id"=any(p_session_ids)))
    then raise exception 'Selected coach has overlapping sessions in this bulk selection.' using errcode='23P01'; end if;
    update public."TrainingSession" set "coachId"=p_coach_id where "id"=any(p_session_ids);
  elsif p_action='CANCEL' then
    update public."SessionBooking" set "status"='CANCELED', "canceledAt"=current_timestamp
      where "trainingSessionId"=any(p_session_ids) and "status" in ('BOOKED','ATTENDED','WAITLIST');
    update public."TrainingSession" set "status"='CANCELED' where "id"=any(p_session_ids);
  elsif p_action='UPDATE_LOCATION' then
    if nullif(trim(p_location),'') is null then raise exception 'Bulk action is incomplete.' using errcode='22023'; end if;
    update public."TrainingSession" set "location"=nullif(trim(p_location),'') where "id"=any(p_session_ids);
  elsif p_action='UPDATE_CAPACITY' then
    if p_capacity is null then raise exception 'Bulk action is incomplete.' using errcode='22023'; end if;
    for session_record in select "id","type" from public."TrainingSession" where "id"=any(p_session_ids) loop
      if session_record."type" <> 'PRIVATE' and
        (select count(*) from public."SessionBooking" where "trainingSessionId"=session_record."id" and "status" in ('BOOKED','ATTENDED','WAITLIST')) > p_capacity
      then raise exception 'Capacity cannot be lower than the current active roster.' using errcode='22023'; end if;
    end loop;
    update public."TrainingSession" set "capacity"=p_capacity where "id"=any(p_session_ids) and "type" <> 'PRIVATE';
  else raise exception 'Bulk action is incomplete.' using errcode='22023';
  end if;
  return found_count;
end; $$;

revoke all on function public.update_training_session(text,text,text,public."TrainingSessionType",public."TrainingSessionStatus",text,text,timestamptz,timestamptz,integer) from public,anon,authenticated;
revoke all on function public.cancel_training_session(text) from public,anon,authenticated;
revoke all on function public.bulk_update_training_sessions(text[],text,text,text,integer) from public,anon,authenticated;
grant execute on function public.update_training_session(text,text,text,public."TrainingSessionType",public."TrainingSessionStatus",text,text,timestamptz,timestamptz,integer) to service_role;
grant execute on function public.cancel_training_session(text) to service_role;
grant execute on function public.bulk_update_training_sessions(text[],text,text,text,integer) to service_role;
