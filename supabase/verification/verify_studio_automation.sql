begin;

do $$
declare
  result jsonb;
begin
  if has_function_privilege(
    'anon',
    'public.run_studio_notification_automation(timestamptz)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.run_studio_notification_automation(timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'Browser roles retain automation execution privilege.';
  end if;

  result := public.run_studio_notification_automation(
    '2099-01-01T03:00:00Z'::timestamptz
  );

  if result->>'status' <> 'SUCCEEDED' then
    raise exception 'Automation verification did not succeed: %', result;
  end if;

  if (result->>'notificationsCreated')::integer <> 0 then
    raise exception 'Future-date verification unexpectedly created notifications: %', result;
  end if;
end;
$$;

rollback;

select count(*)::integer as persisted_run_count
from public."AutomationRun";
