# Current state audit

## Stack

- Next.js 16.2 App Router, React 18, TypeScript, Tailwind CSS, Auth.js 5, npm.
- Supabase Postgres is the only database and `@supabase/supabase-js` is the only database client.
- Auth.js credentials and JWT sessions are preserved. Database access is server-only through `lib/supabase/`.
- The schema, indexes, triggers, RLS policies, and transactional functions live in `supabase/migrations/`.

## Boundaries and security

- Browser code receives only the project URL and public key.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and is never imported by client components.
- Application tables have RLS enabled. Browser roles have no direct table policies.
- Multi-table writes use `SECURITY DEFINER` functions with an empty `search_path`, revoked browser-role access, and service-role-only execution.

## Initial risks resolved

- The former database client and direct connection scripts were removed.
- Data-access implementations were consolidated on generated Supabase types.
- Obsolete seed and backfill paths were removed because this project intentionally starts with an empty database.
- Production hosting was not changed and no production deployment was triggered.

## Preserved unrelated work

Unrelated UI edits and local agent configuration present in the working tree were not staged or modified as part of this migration.
