create unique index "PasswordResetGrant_one_active_per_user_key"
  on public."PasswordResetGrant" ("userId")
  where "usedAt" is null and "revokedAt" is null;

create or replace function public.issue_password_reset_grant(
  p_user_id text,
  p_token_hash text,
  p_expires_at timestamptz,
  p_created_by_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  grant_id uuid := gen_random_uuid();
  target_role public."UserRole";
begin
  if not exists (
    select 1
    from public."User" actor
    where actor."id" = p_created_by_id and actor."role" = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;

  select target."role"
  into target_role
  from public."User" target
  where target."id" = p_user_id
  for update;

  if not found or target_role not in ('COACH', 'CLIENT') then
    raise exception 'Resettable account not found.' using errcode = 'P0002';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid reset token hash.' using errcode = '22023';
  end if;

  if p_expires_at is null
     or p_expires_at <= now()
     or p_expires_at > now() + interval '2 hours' then
    raise exception 'Reset expiry must be within the next two hours.' using errcode = '22023';
  end if;

  update public."PasswordResetGrant"
  set "revokedAt" = now()
  where "userId" = p_user_id
    and "usedAt" is null
    and "revokedAt" is null;

  insert into public."PasswordResetGrant" (
    "id", "userId", "tokenHash", "expiresAt", "createdById"
  ) values (
    grant_id, p_user_id, p_token_hash, p_expires_at, p_created_by_id
  );

  return grant_id;
end;
$$;

revoke all on function public.issue_password_reset_grant(text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.issue_password_reset_grant(text, text, timestamptz, text)
  to service_role;
