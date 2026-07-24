-- Migration: 20260728000000_cleanup_unused_tables_and_columns.sql
-- Description: Remove confirmed unused database tables (Account, Session, VerificationToken, SessionCompensation)
-- and unused legacy columns (User.emailVerified, User.image, User.passwordResetToken, User.passwordResetExpires, Lead.passwordHash, RecurringSessionTemplate.location).

-- 1. Update dependent RPC function admin_delete_client
create or replace function public.admin_delete_client(target_client_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare target_user_id uuid;
begin
  select "userId" into target_user_id from public."Client" where id = target_client_id;
  if not found then raise exception 'Client not found.'; end if;
  delete from public."SessionBooking" where "clientId" = target_client_id;
  delete from public."Payment" where "clientId" = target_client_id;
  delete from public."ClientSubscription" where "clientId" = target_client_id;
  delete from public."File" where "clientId" = target_client_id;
  delete from public."WorkoutNote" where "clientId" = target_client_id;
  delete from public."ClientPreferences" where "clientId" = target_client_id;
  delete from public."Client" where id = target_client_id;
  delete from public."User" where id = target_user_id;
end;
$$;

-- 2. Drop confirmed unused tables
drop table if exists public."Account" cascade;
drop table if exists public."Session" cascade;
drop table if exists public."VerificationToken" cascade;
drop table if exists public."SessionCompensation" cascade;

-- 3. Drop unused legacy columns
alter table public."User"
  drop column if exists "emailVerified",
  drop column if exists "image",
  drop column if exists "passwordResetToken",
  drop column if exists "passwordResetExpires";

alter table public."Lead"
  drop column if exists "passwordHash";

alter table public."RecurringSessionTemplate"
  drop column if exists "location";
