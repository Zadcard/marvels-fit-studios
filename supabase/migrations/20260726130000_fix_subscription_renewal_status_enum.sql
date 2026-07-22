-- The renewal function introduced in 20260725000000 declared new_status as
-- text, then inserted it into the enum-typed ClientSubscription.status column.
-- PostgreSQL does not implicitly cast a PL/pgSQL text variable to the enum,
-- which caused every renewal to fail with SQLSTATE 42804.
--
-- Patch the existing function definition in place so its signature, behavior,
-- security settings, and all existing subscription data remain unchanged.
do $migration$
declare
  current_definition text;
  patched_definition text;
begin
  select pg_get_functiondef(
    'public.admin_mutate_subscription(text,text,text,numeric,integer,integer,text)'::regprocedure
  )
  into current_definition;

  if current_definition is null then
    raise exception 'admin_mutate_subscription function was not found';
  end if;

  if position('new_status text;' in current_definition) = 0 then
    raise exception 'admin_mutate_subscription does not contain the expected text status declaration';
  end if;

  patched_definition := replace(
    current_definition,
    'new_status text;',
    'new_status public."SubscriptionStatus";'
  );

  execute patched_definition;
end;
$migration$;

revoke all on function public.admin_mutate_subscription(text, text, text, numeric, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.admin_mutate_subscription(text, text, text, numeric, integer, integer, text)
  to service_role;
