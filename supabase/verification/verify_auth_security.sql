begin;

do $$
declare
  v_key text := 'verification-auth-throttle-key';
  v_result jsonb;
  v_index integer;
begin
  delete from "AuthThrottle" where "keyHash" = v_key;
  delete from "SecurityEvent" where "identifierHash" = 'verification-identifier';

  v_result := public.check_auth_throttle(v_key);
  if coalesce((v_result ->> 'allowed')::boolean, false) is not true then
    raise exception 'A new authentication key should be allowed';
  end if;

  for v_index in 1..4 loop
    perform public.record_auth_attempt(
      v_key,
      'verification-identifier',
      'verification-ip',
      'email',
      false,
      null
    );
  end loop;

  v_result := public.check_auth_throttle(v_key);
  if coalesce((v_result ->> 'allowed')::boolean, false) is not true then
    raise exception 'The throttle blocked before five failed attempts';
  end if;

  perform public.record_auth_attempt(
    v_key,
    'verification-identifier',
    'verification-ip',
    'email',
    false,
    null
  );

  v_result := public.check_auth_throttle(v_key);
  if coalesce((v_result ->> 'allowed')::boolean, true) is not false then
    raise exception 'The throttle did not block after five failed attempts';
  end if;

  if (v_result ->> 'retryAfterSeconds')::integer <= 0 then
    raise exception 'A blocked authentication key needs a retry duration';
  end if;

  perform public.record_auth_attempt(
    v_key,
    'verification-identifier',
    'verification-ip',
    'email',
    true,
    null
  );

  v_result := public.check_auth_throttle(v_key);
  if coalesce((v_result ->> 'allowed')::boolean, false) is not true then
    raise exception 'A successful login should clear the throttle';
  end if;

  if (
    select count(*)
    from "SecurityEvent"
    where "identifierHash" = 'verification-identifier'
  ) <> 6 then
    raise exception 'Authentication attempts were not fully audited';
  end if;
end;
$$;

rollback;
