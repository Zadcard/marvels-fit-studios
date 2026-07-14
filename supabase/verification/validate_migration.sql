-- Read-only post-import verification. Run with:
-- supabase db query --linked --file supabase/verification/validate_migration.sql

select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

select relname as table_name, relrowsecurity as rls_enabled
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public' and pg_class.relkind = 'r'
order by relname;

select 'User' as table_name, count(*)::bigint as row_count from "User"
union all select 'Lead', count(*) from "Lead"
union all select 'Coach', count(*) from "Coach"
union all select 'Client', count(*) from "Client"
union all select 'Group', count(*) from "Group"
union all select 'Payment', count(*) from "Payment"
union all select 'TrainingSession', count(*) from "TrainingSession"
union all select 'SessionBooking', count(*) from "SessionBooking"
union all select 'SubscriptionPlan', count(*) from "SubscriptionPlan"
union all select 'ClientSubscription', count(*) from "ClientSubscription"
order by table_name;

select 'client users without client profile' as check_name, count(*)::bigint as failures
from "User" u
where u.role = 'CLIENT'
  and not exists (select 1 from "Client" c where c."userId" = u.id)
union all
select 'coach users without coach profile', count(*)
from "User" u
where u.role = 'COACH'
  and not exists (select 1 from "Coach" c where c."userId" = u.id)
union all
select 'credential users without valid password hash', count(*)
from "User"
where role in ('ADMIN', 'COACH', 'CLIENT')
  and (password is null or length(password) < 20)
union all
select 'sessions with invalid time range', count(*)
from "TrainingSession"
where "endsAt" <= "startsAt"
union all
select 'bookings with missing client', count(*)
from "SessionBooking" b
where not exists (select 1 from "Client" c where c.id = b."clientId")
union all
select 'bookings with missing session', count(*)
from "SessionBooking" b
where not exists (select 1 from "TrainingSession" s where s.id = b."trainingSessionId");

