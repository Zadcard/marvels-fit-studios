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
- Applied migrations: `20260714000100_initial_schema.sql` and `20260714000200_server_defaults_and_rls.sql`

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

`supabase db push --linked` applied both migrations to the empty destination. The Docker-based catalog cache emitted a warning because Docker Desktop is unavailable, but the migration itself succeeded. Verification showed local and remote versions aligned 2/2. `supabase db lint --linked --level warning` found no schema errors, and database advisors found no issues.

## Data migration procedure

Data migration remains blocked by the missing valid Neon source URL. Once `NEON_DATABASE_URL` is provided, use a timestamped directory outside the repository:

```powershell
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $HOME "marvels-fit-backups\$timestamp"
New-Item -ItemType Directory -Path $backupDir
pg_dump --dbname $env:NEON_DATABASE_URL --format=custom --data-only --no-owner --no-privileges --file (Join-Path $backupDir 'neon-data.dump')
pg_restore --list (Join-Path $backupDir 'neon-data.dump')
```

Before restoring, run row-count and integrity queries against Neon and save the results. Restore only into the development Supabase project:

```powershell
pg_restore --dbname $env:SUPABASE_DB_URL --data-only --no-owner --no-privileges --single-transaction (Join-Path $backupDir 'neon-data.dump')
npm run supabase:validate
```

If custom-format restore ordering is incompatible, generate a data-only SQL export with explicit inserts and review it before applying. Never use `db reset`, `drop`, `truncate`, or `--clean` against either hosted database.

## Validation requirements after import

- Row counts for every table match the Neon inventory.
- Required fields contain no unexpected nulls.
- Primary keys and unique fields have no duplicates.
- Foreign-key orphan checks return zero.
- Credential users retain password hashes and role/profile relationships.
- Representative admin, coach, and client records match.
- Login, role redirects, dashboards, lead intake/promotion, registration, sessions/bookings, settings, notes/files, and password changes pass against Supabase.

The checked-in `supabase/verification/validate_migration.sql` covers core counts and integrity checks. Add the source-side results to `07-verification-report.md` when credentials are available.

## Rollback

Keep Neon unchanged. If Supabase validation fails, stop using the destination, correct a forward migration, and leave application `DATABASE_URL`/`DIRECT_URL` on the verified source. Do not delete destination data merely to retry; use a new development project or an explicitly approved local reset. Production cutover and Neon retirement require separate explicit approval.
