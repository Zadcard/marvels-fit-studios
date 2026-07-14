# Change log

## Supabase foundation

- Added version-controlled schema, RLS, indexes, triggers, generated database types, server client, domain enums, and centralized fallback handling.
- Linked and applied migrations through `20260714002200`.

## Data access

- Migrated authentication stores, client registration, lead intake, bookings, attendance, schedules, settings, dashboards, files, notes, payments, subscriptions, and training-session workflows.
- Added service-role-only transactional functions for multi-table workflows.

## Cleanup

- Removed the former database module, schema, migration folder, seed, configuration, packages, build hook, CI generation step, direct-connection scripts, and obsolete environment variables.
- Regenerated `package-lock.json` with the final dependency graph.
- Updated tests and documentation to use database-neutral terminology.

## Behavior

Existing routes and Auth.js behavior were preserved. The database starts empty by explicit product decision; no fixture or historical data was imported.

## Security and operations

- Removed demo credential fallback and made authorization depend on persisted users and roles.
- Added credential throttling, hashed identifiers, and security-event auditing.
- Moved file contents from database byte arrays to a private Supabase Storage bucket.
- Changed database failures to surface through route error handling rather than silently presenting empty studio data.

## Transformation and automation roadmap

- Added assessment, goals, exercise library, training programs, workouts, performance logs, progress metrics, and client check-ins.
- Added coach transformation and client progress workspaces with role-scoped server actions.
- Added recurring weekly session templates with idempotent occurrence generation.
- Added in-app session and renewal notifications, an audited hourly cron job, and notification pages for all roles.
- Added an append-only billing ledger, automatic payment receipts, protected receipt rendering, and admin adjustment support.

## Remaining-risk remediation

- Overrode the PostCSS transitive dependency to patched version `8.5.19` for every consumer, including Next.js, and regenerated the npm lockfile.
- Added a Docker-backed `supabase-schema` GitHub Actions job that performs a clean local migration reset and fails on database lint warnings.
- Repeated clean installation, audit, lint, type checking, unit tests, production build, and browser tests on supported Node 24.
