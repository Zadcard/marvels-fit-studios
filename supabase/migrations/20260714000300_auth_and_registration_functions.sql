create or replace function public.register_client(
  p_full_name text,
  p_phone text,
  p_email text,
  p_group_id text,
  p_client_id text,
  p_password_hash text
)
returns table ("userId" text, "clientId" text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_user_id text;
begin
  insert into public."User" (
    "name", "clientId", "email", "password", "mustChangePassword", "role"
  ) values (
    p_full_name, p_client_id, nullif(p_email, ''), p_password_hash, true, 'CLIENT'
  )
  returning "id" into created_user_id;

  insert into public."Client" (
    "userId", "fullName", "phone", "groupId", "status"
  ) values (
    created_user_id, p_full_name, p_phone, p_group_id, 'ACTIVE'
  );

  return query select created_user_id, p_client_id;
end;
$$;

revoke all on function public.register_client(text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_client(text, text, text, text, text, text)
  to service_role;
