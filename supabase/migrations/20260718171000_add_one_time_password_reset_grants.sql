create table public."PasswordResetGrant" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" text not null references public."User"("id") on delete cascade,
  "tokenHash" text not null unique check ("tokenHash" ~ '^[a-f0-9]{64}$'),
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz,
  "revokedAt" timestamptz,
  "createdById" text not null references public."User"("id") on delete restrict,
  "createdAt" timestamptz not null default now(),
  constraint "PasswordResetGrant_state_check" check (
    not ("usedAt" is not null and "revokedAt" is not null)
  ),
  constraint "PasswordResetGrant_expiry_check" check ("expiresAt" > "createdAt")
);

create index "PasswordResetGrant_user_idx"
  on public."PasswordResetGrant" ("userId");
create index "PasswordResetGrant_created_by_idx"
  on public."PasswordResetGrant" ("createdById");
create index "PasswordResetGrant_active_expiry_idx"
  on public."PasswordResetGrant" ("expiresAt")
  where "usedAt" is null and "revokedAt" is null;

alter table public."PasswordResetGrant" enable row level security;
revoke all on table public."PasswordResetGrant" from anon, authenticated;
grant all on table public."PasswordResetGrant" to service_role;

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
begin
  if not exists (
    select 1
    from public."User" actor
    where actor."id" = p_created_by_id and actor."role" = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public."User" target
    where target."id" = p_user_id and target."role" in ('COACH', 'CLIENT')
  ) then
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

create or replace function public.consume_password_reset_grant(
  p_token_hash text,
  p_password_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_grant record;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  if p_password_hash is null or p_password_hash !~ '^\$2[aby]\$12\$' then
    raise exception 'Invalid password hash.' using errcode = '22023';
  end if;

  select reset_grant."id", reset_grant."userId"
  into matched_grant
  from public."PasswordResetGrant" reset_grant
  where reset_grant."tokenHash" = p_token_hash
    and reset_grant."usedAt" is null
    and reset_grant."revokedAt" is null
    and reset_grant."expiresAt" > now()
  for update;

  if not found then
    return false;
  end if;

  update public."User"
  set "password" = p_password_hash,
      "mustChangePassword" = false,
      "passwordResetToken" = null,
      "passwordResetExpires" = null,
      "updatedAt" = now()
  where "id" = matched_grant."userId";

  if not found then
    return false;
  end if;

  update public."PasswordResetGrant"
  set "usedAt" = now()
  where "id" = matched_grant."id";

  update public."PasswordResetGrant"
  set "revokedAt" = now()
  where "userId" = matched_grant."userId"
    and "id" <> matched_grant."id"
    and "usedAt" is null
    and "revokedAt" is null;

  return true;
end;
$$;

revoke all on function public.issue_password_reset_grant(text, text, timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.consume_password_reset_grant(text, text)
  from public, anon, authenticated;
grant execute on function public.issue_password_reset_grant(text, text, timestamptz, text)
  to service_role;
grant execute on function public.consume_password_reset_grant(text, text)
  to service_role;
