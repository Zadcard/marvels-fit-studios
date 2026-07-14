# Supabase migration

## Final architecture

The Next.js server calls one service-role Supabase client from `lib/supabase/server.ts`. Repositories and services return typed application records. Atomic workflows are implemented as service-role-only SQL functions. Auth.js remains the identity and session layer.

## Reproducible schema

Run `npm run supabase:migrations` to compare local and linked history. The migrations define 19 application tables, 12 enums, relationships, constraints, indexes, timestamp triggers, RLS, and workflow functions. Regenerate types with `npm run supabase:types` after every schema change.

## Fresh-start decision

No legacy records were imported. The destination was deliberately verified empty so the team can begin with a clean dataset. `supabase/seed.sql` contains no application fixtures.

## Security model

- RLS is enabled on application tables.
- Browser roles cannot execute server workflow functions.
- The service-role key stays in server environment variables only.
- Database functions set `search_path = ''` and schema-qualify referenced objects.

## Validation

Migration history is aligned through `20260714001200`. Schema lint, generated types, application checks, and row-count verification are recorded in `07-verification-report.md`.
