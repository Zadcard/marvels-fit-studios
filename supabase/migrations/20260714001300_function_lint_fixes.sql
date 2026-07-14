-- Correct PL/pgSQL name resolution and bridge UUID-valued arguments to the
-- schema's text primary keys. The preceding migrations remain immutable and
-- this forward migration patches their stored definitions reproducibly.
do $$
declare
  signature text;
  definition text;
begin
  foreach signature in array array[
    'public.update_session_attendance(text,text,public."BookingStatus")',
    'public.update_training_session(text,text,text,public."TrainingSessionType",public."TrainingSessionStatus",text,text,timestamptz,timestamptz,integer)',
    'public.cancel_training_session(text)'
  ] loop
    select pg_get_functiondef(signature::regprocedure) into definition;
    definition := replace(
      definition,
      E'AS $function$\n',
      E'AS $function$\n#variable_conflict use_column\n'
    );
    execute definition;
  end loop;

  select pg_get_functiondef('public.admin_save_client(jsonb)'::regprocedure)
    into definition;
  definition := replace(definition, 'target_user_id uuid;', 'target_user_id text;');
  definition := replace(definition, 'target_client_id uuid;', 'target_client_id text;');
  definition := replace(definition, 'latest_subscription_id uuid;', 'latest_subscription_id text;');
  definition := replace(definition, '(payload->>''clientId'')::uuid', '(payload->>''clientId'')');
  definition := replace(definition, 'nullif(payload->>''groupId'', '''')::uuid', 'nullif(payload->>''groupId'', '''')');
  execute definition;

  select pg_get_functiondef('public.admin_delete_client(uuid)'::regprocedure)
    into definition;
  definition := replace(definition, 'target_user_id uuid;', 'target_user_id text;');
  definition := replace(definition, ' = target_client_id', ' = target_client_id::text');
  execute definition;

  select pg_get_functiondef('public.admin_save_subscription(jsonb)'::regprocedure)
    into definition;
  definition := replace(definition, 'target_id uuid;', 'target_id text;');
  definition := replace(definition, 'payment_id uuid;', 'payment_id text;');
  definition := replace(definition, '(payload->>''clientId'')::uuid', '(payload->>''clientId'')');
  definition := replace(definition, '(payload->>''planId'')::uuid', '(payload->>''planId'')');
  definition := replace(definition, 'nullif(payload->>''subscriptionId'','''')::uuid', 'nullif(payload->>''subscriptionId'','''')');
  definition := replace(definition, '''00000000-0000-0000-0000-000000000000''::uuid', '''00000000-0000-0000-0000-000000000000''');
  execute definition;

  select pg_get_functiondef('public.admin_mutate_subscription(uuid,text)'::regprocedure)
    into definition;
  definition := replace(definition, 'where id=target_id', 'where id=target_id::text');
  definition := replace(definition, 'where id = target_id', 'where id = target_id::text');
  definition := replace(definition, ',target_id);', ',target_id::text);');
  execute definition;

  select pg_get_functiondef('public.promote_lead_to_client(uuid,text,text)'::regprocedure)
    into definition;
  definition := replace(definition, 'where id = target_lead_id', 'where id = target_lead_id::text');
  execute definition;
end;
$$;
