# Prisma and Neon Removal Design

## Goal

Make Supabase the application's only database platform and remove Prisma and Neon from runtime code, tooling, configuration, scripts, tests, and active documentation without changing product behavior.

## Architecture

- Server Components, Server Actions, Route Handlers, repositories, and services call a single server-only typed Supabase client.
- Browser code never receives the service-role key and does not query protected business tables directly.
- Simple reads and writes use the generated PostgREST API through `@supabase/supabase-js`.
- Multi-table or concurrency-sensitive workflows use version-controlled PostgreSQL functions invoked with `supabase.rpc(...)` so they remain atomic.
- Application enums and row types derive from `lib/supabase/database.types.ts`; no generated Prisma types remain.
- Auth.js remains the session/authentication layer. Its user lookup and password workflows use the same Supabase server boundary.
- Supabase migrations remain the schema source of truth. The old Prisma schema and migration directory are removed after the final boundary scan passes.

## Error and Security Model

- The Supabase service-role key is read only in `lib/supabase/server.ts`, which is protected by `server-only`.
- Repository helpers turn PostgREST errors into contextual server errors; UI-facing actions continue returning their existing safe result shapes.
- Database functions are `SECURITY DEFINER`, use an empty fixed search path, are revoked from `anon` and `authenticated`, and are granted only to `service_role`.
- Route handlers and server actions retain application-level session and role checks because the service-role client bypasses RLS.

## Migration Sequence

1. Replace Prisma enum/type imports with Supabase-derived application types.
2. Replace authentication and low-level user access.
3. Add transactional database functions and migrate mutation services/actions.
4. Migrate read repositories and server-rendered pages.
5. Replace or retire Prisma-only maintenance/import scripts and their tests.
6. Remove Prisma/Neon packages, configuration, environment variables, CI commands, schema, migrations, and obsolete documentation.
7. Regenerate database types, apply migrations, run full verification, and scan for forbidden dependencies.

## Existing Data

The target Supabase schema is already applied and currently empty. Existing Neon data cannot be copied until a valid read-only Neon connection string is supplied. Neon must remain untouched as the rollback source. This blocker does not require Prisma to remain in the application runtime.

## Rollback

- Keep Neon and the pre-cutover Git commit unchanged.
- Revert the cutover commits if application validation fails.
- Do not point production at Supabase until schema, data, authentication relationships, and representative workflows have been validated.
