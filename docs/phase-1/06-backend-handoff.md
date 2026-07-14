# Backend Handoff

## Current state

The hosted development Supabase project `ggrddqflqumokoyzpjic` has the complete empty schema applied through two version-controlled migrations. Local/remote histories align. RLS is enabled on all 19 application tables, and no browser role has application-table access.

Auth remains Auth.js credentials with JWT sessions. Do not replace it with Supabase Auth or enable Supabase email signup as an incidental database-migration step.

## Required server secrets

- `AUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `DATABASE_URL` and `DIRECT_URL` during Prisma compatibility
- `NEON_DATABASE_URL` only until export/validation completes

Public values are limited to `NEXT_PUBLIC_SUPABASE_URL` and a publishable/anon key. A service-role key in any browser bundle is a critical incident and must be rotated.

## Data access

Use `lib/supabase/server.ts` only from server modules. `lib/supabase/client.ts` exists for future approved RLS-authenticated use but should not query application tables while Auth.js remains unmapped to Supabase JWT claims. Database errors should be mapped through `lib/supabase/errors.ts` before reaching UI code.

Prisma remains a temporary compatibility layer across 71 runtime/script files. The Auth.js Prisma adapter has already been removed. Do not delete Prisma schema/packages or `prebuild` generation until import counts reach zero and transaction-heavy workflows have equivalent tests.

## Migration commands

```powershell
npx supabase link --project-ref ggrddqflqumokoyzpjic
npm run supabase:migrations
npm run supabase:lint
npm run supabase:types
npm run supabase:validate
```

For a new schema change:

```powershell
npx supabase migration new descriptive_name
npm run supabase:reset
npm run supabase:types
npm run verify
```

Apply to hosted development only after review with `npx supabase db push --linked --dry-run`, then `npx supabase db push --linked`.

## Outstanding backend tasks

1. Obtain a valid read-only Neon direct URL.
2. Inventory and back up Neon.
3. Import data into development Supabase and run the validation report.
4. Set development `DATABASE_URL`/`DIRECT_URL` to Supabase and smoke test existing Prisma paths.
5. Migrate repository/service groups to typed Supabase queries or reviewed database functions, prioritizing simple reads before transactions.
6. Replace Prisma-generated enum/domain imports with application-owned/generated Supabase types.
7. Remove Prisma only after zero-usage scans and full verification.
8. Repeat reviewed migrations/data validation for a separate production Supabase project before production cutover.

## Decisions not to reverse accidentally

- Neon is the rollback source until explicit retirement approval.
- Auth.js remains the sole identity system for Phase 1.
- Browser roles remain denied until a verified JWT/RLS mapping exists.
- Hosted database changes come from migrations, not dashboard-only edits.
- Preview uses development data; production data is not a frontend sandbox.
- No `service_role` value belongs in Git, logs, screenshots, client modules, or `NEXT_PUBLIC_*` variables.
