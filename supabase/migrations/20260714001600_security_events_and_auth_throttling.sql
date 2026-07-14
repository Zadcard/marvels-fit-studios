create table "SecurityEvent" (
  "id" uuid primary key default gen_random_uuid(),
  "eventType" text not null,
  "outcome" text not null,
  "userId" text references "User"("id") on delete set null,
  "identifierHash" text,
  "ipHash" text,
  "authMethod" text,
  "metadata" jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now()
);

create table "AuthThrottle" (
  "keyHash" text primary key,
  "failureCount" integer not null default 0 check ("failureCount" >= 0),
  "windowStartedAt" timestamptz not null default now(),
  "blockedUntil" timestamptz,
  "lastAttemptAt" timestamptz not null default now()
);

create index "SecurityEvent_eventType_createdAt_idx"
  on "SecurityEvent" ("eventType", "createdAt" desc);
create index "SecurityEvent_userId_createdAt_idx"
  on "SecurityEvent" ("userId", "createdAt" desc);
create index "AuthThrottle_lastAttemptAt_idx"
  on "AuthThrottle" ("lastAttemptAt");

alter table "SecurityEvent" enable row level security;
alter table "AuthThrottle" enable row level security;

revoke all on table "SecurityEvent" from anon, authenticated;
revoke all on table "AuthThrottle" from anon, authenticated;
grant all on table "SecurityEvent" to service_role;
grant all on table "AuthThrottle" to service_role;

create or replace function public.check_auth_throttle(p_key_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_record "AuthThrottle"%rowtype;
  v_retry_after integer := 0;
begin
  select *
  into v_record
  from "AuthThrottle"
  where "keyHash" = p_key_hash;

  if not found then
    return jsonb_build_object('allowed', true, 'retryAfterSeconds', 0);
  end if;

  if v_record."blockedUntil" is not null and v_record."blockedUntil" > now() then
    v_retry_after := greatest(
      1,
      ceil(extract(epoch from (v_record."blockedUntil" - now())))::integer
    );
    return jsonb_build_object(
      'allowed', false,
      'retryAfterSeconds', v_retry_after
    );
  end if;

  if v_record."windowStartedAt" < now() - interval '15 minutes' then
    delete from "AuthThrottle" where "keyHash" = p_key_hash;
  end if;

  return jsonb_build_object('allowed', true, 'retryAfterSeconds', 0);
end;
$$;

create or replace function public.record_auth_attempt(
  p_key_hash text,
  p_identifier_hash text,
  p_ip_hash text,
  p_auth_method text,
  p_success boolean,
  p_user_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_failure_count integer := 0;
  v_blocked_until timestamptz := null;
begin
  if p_success then
    delete from "AuthThrottle" where "keyHash" = p_key_hash;

    insert into "SecurityEvent" (
      "eventType", "outcome", "userId", "identifierHash", "ipHash", "authMethod"
    ) values (
      'AUTH_LOGIN', 'SUCCESS', p_user_id, p_identifier_hash, p_ip_hash, p_auth_method
    );

    return jsonb_build_object(
      'blocked', false,
      'failureCount', 0,
      'retryAfterSeconds', 0
    );
  end if;

  insert into "AuthThrottle" (
    "keyHash", "failureCount", "windowStartedAt", "blockedUntil", "lastAttemptAt"
  ) values (
    p_key_hash, 1, now(), null, now()
  )
  on conflict ("keyHash") do update
  set
    "failureCount" = case
      when "AuthThrottle"."windowStartedAt" < now() - interval '15 minutes' then 1
      else "AuthThrottle"."failureCount" + 1
    end,
    "windowStartedAt" = case
      when "AuthThrottle"."windowStartedAt" < now() - interval '15 minutes' then now()
      else "AuthThrottle"."windowStartedAt"
    end,
    "lastAttemptAt" = now()
  returning "failureCount" into v_failure_count;

  if v_failure_count >= 5 then
    v_blocked_until := now() + interval '15 minutes';
    update "AuthThrottle"
    set "blockedUntil" = v_blocked_until
    where "keyHash" = p_key_hash;
  end if;

  insert into "SecurityEvent" (
    "eventType", "outcome", "userId", "identifierHash", "ipHash", "authMethod",
    "metadata"
  ) values (
    'AUTH_LOGIN',
    case when v_blocked_until is null then 'FAILURE' else 'BLOCKED' end,
    p_user_id,
    p_identifier_hash,
    p_ip_hash,
    p_auth_method,
    jsonb_build_object('failureCount', v_failure_count)
  );

  return jsonb_build_object(
    'blocked', v_blocked_until is not null,
    'failureCount', v_failure_count,
    'retryAfterSeconds',
      case
        when v_blocked_until is null then 0
        else ceil(extract(epoch from (v_blocked_until - now())))::integer
      end
  );
end;
$$;

create or replace function public.record_security_event(
  p_event_type text,
  p_outcome text,
  p_user_id text default null,
  p_identifier_hash text default null,
  p_ip_hash text default null,
  p_auth_method text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
begin
  insert into "SecurityEvent" (
    "eventType", "outcome", "userId", "identifierHash", "ipHash", "authMethod",
    "metadata"
  ) values (
    p_event_type, p_outcome, p_user_id, p_identifier_hash, p_ip_hash,
    p_auth_method, coalesce(p_metadata, '{}'::jsonb)
  )
  returning "id" into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.check_auth_throttle(text) from public, anon, authenticated;
revoke all on function public.record_auth_attempt(text,text,text,text,boolean,text) from public, anon, authenticated;
revoke all on function public.record_security_event(text,text,text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.check_auth_throttle(text) to service_role;
grant execute on function public.record_auth_attempt(text,text,text,text,boolean,text) to service_role;
grant execute on function public.record_security_event(text,text,text,text,text,text,jsonb) to service_role;
