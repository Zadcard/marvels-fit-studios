# Supabase Migration

## Original architecture

The application used Prisma 7.6 with `@prisma/adapter-pg` and `pg` against Neon PostgreSQL. `lib/prisma.ts` owns the pool/client and retry fallback. Prisma-generated models/enums flow into Server Actions, repositories, services, tests, operational scripts, and Auth.js. Auth.js uses credentials and JWT sessions; database sessions are not the runtime session mechanism.

The source connection values available during this run were placeholders, not valid PostgreSQL URLs. The read-only backend smoke check failed with `ENOTFOUND base`. No Neon schema/data was read, changed, exported, or deleted.

## Supabase destination

- Project name: `marvels-fit-studios`
- Project ref: `ggrddqflqumokoyzpjic`
- Region: `eu-west-2`
- PostgreSQL: 17
- Initial destination state: healthy, no public tables, no migration history
- Applied migrations: the initial schema, server defaults/RLS hardening, and two client-registration function migrations through `20260714000400_registration_optional_group.sql`

The first migration is a consolidated baseline generated from the validated final Prisma schema. The second adds PostgreSQL-generated text UUID defaults for new direct Supabase inserts, database-managed `updatedAt` triggers, the existing file-expiry default, grants, and RLS hardening.

## Final schema represented in migrations

Nineteen public tables are version controlled: `StudioSettings`; `User`, `Account`, `Session`, `VerificationToken`; `Lead`; `Coach`, `Client`, `ClientPreferences`, `Group`; `Payment`, `SessionCompensation`; `File`, `WorkoutNote`; `TrainingSession`, `SessionBooking`, `SessionNote`; `SubscriptionPlan`; and `ClientSubscription`.

Twelve enums, all primary keys, unique constraints, indexes, foreign keys, nullability, defaults, and cascade/restrict/set-null behavior from the effective Prisma schema are preserved. The obsolete schedule-block tables are not recreated because the final Prisma migration removed them.

## Authentication and RLS

Auth.js remains the identity provider. Supabase Auth signup is disabled in local config to avoid introducing a second identity system. Because Auth.js JWTs are not Supabase Auth JWTs:

- RLS is enabled on every application table.
- `anon` and `authenticated` receive no table privileges or policies.
- `service_role` receives server-side access.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed through `NEXT_PUBLIC_*` variables or browser imports.

This is intentional deny-by-default RLS. Do not add permissive browser policies until a reviewed token/claims mapping exists.

## Data-access structure

- `lib/supabase/client.ts`: typed browser client factory reserved for future RLS-authenticated use; currently unused by product code.
- `lib/supabase/server.ts`: typed server-only client using the service-role key and disabled session persistence.
- `lib/supabase/config.ts`: public-value validation.
- `lib/supabase/errors.ts`: centralized sanitized database error mapping.
- `lib/supabase/database.types.ts`: generated from the live hosted schema.

The Auth.js Prisma adapter was removed because JWT credentials sessions do not require it. Existing repositories/services still use Prisma as a temporary compatibility layer. Removing that layer now would require translating 71 runtime/script files, nested relation queries, and transactions without migrated data or live behavioral verification. This is the explicit blocker—not a claim that Prisma removal is complete.

## Schema migration result

`supabase db push --linked` applied all four migrations to the empty destination. The Docker-based catalog cache emitted a warning because Docker Desktop is unavailable, but the migrations succeeded. `supabase db lint --linked --level warning` found no schema errors, and database advisors found no issues.

## Fresh-start data decision

On 2026-07-14 the user explicitly selected an empty Supabase database. Data migration from Neon is intentionally out of scope, not blocked. `NEON_DATABASE_URL` is not required and has been removed from the environment contract. No old users, clients, credentials, subscriptions, payments, sessions, or other records will be imported.

The linked database was checked after this decision: all 19 application tables reported zero rows. New records will be created through the Supabase-backed application after the runtime cutover.

## Rollback

If Supabase validation fails, correct it with a forward migration or revert the application commit. Do not reconnect the application to Neon or import old records. Do not delete hosted destination data merely to retry; use an explicitly approved local reset for local development.
