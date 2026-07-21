-- Generic rate limiting for public-facing actions (distinct from
-- AuthThrottle, which only tracks failed sign-in attempts). Any action can
-- reuse this by hashing its own key (action + identifier + IP) and calling
-- consume_rate_limit with its own thresholds.
create table "RateLimitBucket" (
  "keyHash" text primary key,
  "requestCount" integer not null default 0 check ("requestCount" >= 0),
  "windowStartedAt" timestamptz not null default now(),
  "blockedUntil" timestamptz,
  "lastRequestAt" timestamptz not null default now()
);

create index "RateLimitBucket_lastRequestAt_idx"
  on "RateLimitBucket" ("lastRequestAt");

alter table "RateLimitBucket" enable row level security;
revoke all on table "RateLimitBucket" from anon, authenticated;
grant all on table "RateLimitBucket" to service_role;

-- Fixed-window counter: allows up to p_max_attempts requests per
-- p_window_seconds; once exceeded, blocks the key for p_block_seconds.
create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_max_attempts integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_record "RateLimitBucket"%rowtype;
  v_now timestamptz := now();
  v_count integer;
  v_window_started timestamptz;
  v_blocked_until timestamptz;
begin
  insert into "RateLimitBucket" (
    "keyHash", "requestCount", "windowStartedAt", "blockedUntil", "lastRequestAt"
  ) values (
    p_key_hash, 1, v_now, null, v_now
  )
  on conflict ("keyHash") do update
  set
    "requestCount" = case
      when "RateLimitBucket"."windowStartedAt" < v_now - make_interval(secs => p_window_seconds)
        then 1
      else "RateLimitBucket"."requestCount" + 1
    end,
    "windowStartedAt" = case
      when "RateLimitBucket"."windowStartedAt" < v_now - make_interval(secs => p_window_seconds)
        then v_now
      else "RateLimitBucket"."windowStartedAt"
    end,
    "blockedUntil" = case
      when "RateLimitBucket"."windowStartedAt" < v_now - make_interval(secs => p_window_seconds)
        then null
      else "RateLimitBucket"."blockedUntil"
    end,
    "lastRequestAt" = v_now
  returning "requestCount", "windowStartedAt", "blockedUntil"
  into v_count, v_window_started, v_blocked_until;

  if v_blocked_until is not null and v_blocked_until > v_now then
    return jsonb_build_object(
      'allowed', false,
      'retryAfterSeconds',
        greatest(1, ceil(extract(epoch from (v_blocked_until - v_now)))::integer)
    );
  end if;

  if v_count > p_max_attempts then
    v_blocked_until := v_now + make_interval(secs => p_block_seconds);
    update "RateLimitBucket"
    set "blockedUntil" = v_blocked_until
    where "keyHash" = p_key_hash;

    return jsonb_build_object(
      'allowed', false,
      'retryAfterSeconds',
        greatest(1, ceil(extract(epoch from (v_blocked_until - v_now)))::integer)
    );
  end if;

  return jsonb_build_object('allowed', true, 'retryAfterSeconds', 0);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer, integer)
  to service_role;
