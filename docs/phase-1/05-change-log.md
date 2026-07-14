# Change log

## Supabase foundation

- Added version-controlled schema, RLS, indexes, triggers, generated database types, server client, domain enums, and centralized fallback handling.
- Linked and applied migrations through `20260714001500`.

## Data access

- Migrated authentication stores, client registration, lead intake, bookings, attendance, schedules, settings, dashboards, files, notes, payments, subscriptions, and training-session workflows.
- Added service-role-only transactional functions for multi-table workflows.

## Cleanup

- Removed the former database module, schema, migration folder, seed, configuration, packages, build hook, CI generation step, direct-connection scripts, and obsolete environment variables.
- Regenerated `package-lock.json` with the final dependency graph.
- Updated tests and documentation to use database-neutral terminology.

## Behavior

Existing routes and Auth.js behavior were preserved. The database starts empty by explicit product decision; no fixture or historical data was imported.
