-- These SECURITY DEFINER functions are trigger helpers and must not be exposed
-- as PostgREST RPCs to public API roles.
revoke execute on function public.create_payment_ledger_entry()
  from public, anon, authenticated;
revoke execute on function public.log_training_session_change()
  from public, anon, authenticated;

grant execute on function public.create_payment_ledger_entry() to service_role;
grant execute on function public.log_training_session_change() to service_role;
