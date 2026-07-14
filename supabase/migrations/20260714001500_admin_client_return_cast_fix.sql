do $$
declare definition text;
begin
  select pg_get_functiondef('public.admin_save_client(jsonb)'::regprocedure)
    into definition;
  definition := replace(
    definition,
    'return target_client_id;',
    'return target_client_id::uuid;'
  );
  execute definition;
end;
$$;
