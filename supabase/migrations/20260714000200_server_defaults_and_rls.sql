-- Supabase-specific hardening for a server-only Auth.js application.
-- Auth.js sessions are not Supabase Auth sessions, so anon/authenticated roles
-- receive no application-table privileges or policies in Phase 1.

create extension if not exists pgcrypto with schema extensions;

alter table "User" alter column "id" set default gen_random_uuid()::text;
alter table "Lead" alter column "id" set default gen_random_uuid()::text;
alter table "Account" alter column "id" set default gen_random_uuid()::text;
alter table "Session" alter column "id" set default gen_random_uuid()::text;
alter table "Coach" alter column "id" set default gen_random_uuid()::text;
alter table "Client" alter column "id" set default gen_random_uuid()::text;
alter table "ClientPreferences" alter column "id" set default gen_random_uuid()::text;
alter table "Group" alter column "id" set default gen_random_uuid()::text;
alter table "Payment" alter column "id" set default gen_random_uuid()::text;
alter table "SessionCompensation" alter column "id" set default gen_random_uuid()::text;
alter table "File" alter column "id" set default gen_random_uuid()::text;
alter table "WorkoutNote" alter column "id" set default gen_random_uuid()::text;
alter table "TrainingSession" alter column "id" set default gen_random_uuid()::text;
alter table "SessionBooking" alter column "id" set default gen_random_uuid()::text;
alter table "SubscriptionPlan" alter column "id" set default gen_random_uuid()::text;
alter table "ClientSubscription" alter column "id" set default gen_random_uuid()::text;
alter table "SessionNote" alter column "id" set default gen_random_uuid()::text;

alter table "StudioSettings" alter column "updatedAt" set default current_timestamp;
alter table "User" alter column "updatedAt" set default current_timestamp;
alter table "Lead" alter column "updatedAt" set default current_timestamp;
alter table "Client" alter column "updatedAt" set default current_timestamp;
alter table "ClientPreferences" alter column "updatedAt" set default current_timestamp;
alter table "File" alter column "updatedAt" set default current_timestamp;
alter table "File" alter column "expiresAt" set default (current_timestamp + interval '3 days');
alter table "WorkoutNote" alter column "updatedAt" set default current_timestamp;
alter table "TrainingSession" alter column "updatedAt" set default current_timestamp;
alter table "SessionBooking" alter column "updatedAt" set default current_timestamp;
alter table "SubscriptionPlan" alter column "updatedAt" set default current_timestamp;
alter table "ClientSubscription" alter column "updatedAt" set default current_timestamp;
alter table "SessionNote" alter column "updatedAt" set default current_timestamp;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new."updatedAt" = current_timestamp;
  return new;
end;
$$;

create trigger "StudioSettings_set_updated_at" before update on "StudioSettings"
for each row execute function public.set_updated_at();
create trigger "User_set_updated_at" before update on "User"
for each row execute function public.set_updated_at();
create trigger "Lead_set_updated_at" before update on "Lead"
for each row execute function public.set_updated_at();
create trigger "Client_set_updated_at" before update on "Client"
for each row execute function public.set_updated_at();
create trigger "ClientPreferences_set_updated_at" before update on "ClientPreferences"
for each row execute function public.set_updated_at();
create trigger "File_set_updated_at" before update on "File"
for each row execute function public.set_updated_at();
create trigger "WorkoutNote_set_updated_at" before update on "WorkoutNote"
for each row execute function public.set_updated_at();
create trigger "TrainingSession_set_updated_at" before update on "TrainingSession"
for each row execute function public.set_updated_at();
create trigger "SessionBooking_set_updated_at" before update on "SessionBooking"
for each row execute function public.set_updated_at();
create trigger "SubscriptionPlan_set_updated_at" before update on "SubscriptionPlan"
for each row execute function public.set_updated_at();
create trigger "ClientSubscription_set_updated_at" before update on "ClientSubscription"
for each row execute function public.set_updated_at();
create trigger "SessionNote_set_updated_at" before update on "SessionNote"
for each row execute function public.set_updated_at();

alter table "StudioSettings" enable row level security;
alter table "User" enable row level security;
alter table "Lead" enable row level security;
alter table "Account" enable row level security;
alter table "Session" enable row level security;
alter table "VerificationToken" enable row level security;
alter table "Coach" enable row level security;
alter table "Client" enable row level security;
alter table "ClientPreferences" enable row level security;
alter table "Group" enable row level security;
alter table "Payment" enable row level security;
alter table "SessionCompensation" enable row level security;
alter table "File" enable row level security;
alter table "WorkoutNote" enable row level security;
alter table "TrainingSession" enable row level security;
alter table "SessionBooking" enable row level security;
alter table "SubscriptionPlan" enable row level security;
alter table "ClientSubscription" enable row level security;
alter table "SessionNote" enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant execute on function public.set_updated_at() to service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on tables to service_role;

