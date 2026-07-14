# Verification report

## Completed checks

- Clean `npm ci`: passed; 771 packages installed from the regenerated lockfile.
- `npm run lint`: passed with no findings.
- `npm run typecheck`: passed after successful Next route type generation.
- `npm run test:run`: 24 files and 304 tests passed.
- `npm run build`: production build passed; all routes compiled and page data generated.
- `npm run supabase:migrations`: local and remote history aligned through `20260714002200`.
- `npm run supabase:lint`: passed with no schema errors or warnings.
- `npm run supabase:validate`: six integrity checks returned zero failures.
- `smoke_workflow_functions.sql`: all transactional workflow functions passed inside a rolled-back transaction.
- `verify_empty_database.sql`: all 19 application tables returned zero rows after the smoke rollback.
- Generated database types matched a fresh linked-project generation byte for byte.
- Removed-package scan: the former database packages and direct driver are absent from the dependency tree and lockfile.
- Repository scan: no active legacy database runtime or environment references remain.
- `npm run supabase:verify-roadmap`: passed against the linked project; generated 3 recurring occurrences, proved a second run generated 0 duplicates, generated 2 due reminders, proved a second run generated 0 duplicates, and verified a payment-created receipt. Synthetic rows were removed.
- `npm run test:e2e`: 6 Chromium tests passed, including landing/login, invalid credentials, and anonymous redirect boundaries for admin, coach, and client.
- `npm run verify`: passed end-to-end after the roadmap implementation (lint, typecheck, 304 tests, production build).
- `npm ls prisma @prisma/client @neondatabase/serverless --depth=0`: empty; repository scan found no Prisma, Neon, or `NEON_DATABASE_URL` references outside ignored build/dependency output.
- Server-boundary scan found no service-role secret access outside the dedicated Supabase server client.
- Clean `npm ci` on supported Node 24.14.0: passed after stopping the test web server that held a generated native module open.
- `npm ls postcss --all`: all consumers resolve to patched PostCSS 8.5.19; Next.js's dependency is deduplicated to the override.
- `npm audit --omit=dev`: passed with zero vulnerabilities.
- The Docker-backed `supabase-schema` GitHub Actions job now starts local Supabase, performs `db reset --local`, and fails on schema lint warnings for every main-branch pull request.

## Environment note

Docker Desktop and WSL are not installed on this Windows host and this process is not elevated, so the local container stack could not be started here. That host-specific gap is covered by the new Docker-backed CI reset job, while linked migration, lint, and live workflow verification passed remotely. Final clean-install verification used supported Node 24.14.0. No dependency vulnerabilities remain.
