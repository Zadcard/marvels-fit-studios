begin;

-- TrainingCategory is now a table. admin_save_client still accepts the old
-- enum value in its compatibility payload, so make that cast resolve to the
-- renamed enum instead of PostgreSQL's composite table row type.
do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.admin_save_client(jsonb)'::regprocedure)
    into definition;

  definition := replace(
    definition,
    '::public."TrainingCategory"',
    '::public."LegacyTrainingCategory"'
  );

  if definition not like '%::public."LegacyTrainingCategory"%' then
    raise exception 'admin_save_client legacy category cast was not found.';
  end if;

  execute definition;
end;
$$;

revoke all on function public.admin_save_client(jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_client(jsonb) to service_role;

commit;
