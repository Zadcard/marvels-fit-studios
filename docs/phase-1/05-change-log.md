# Phase 1 Change Log

## Audit and planning

- Files: `docs/phase-1/00-current-state-audit.md`, `01-phase-1-plan.md`, and `docs/plans/2026-07-14-phase-1-supabase-migration-design.md`.
- Reason: establish the protected baseline and choose a behavior-preserving migration approach.
- Previous: no Phase 1 evidence or migration decision record.
- New: repository evidence, alternatives, staged architecture, validation, and rollback plan.
- Validation: baseline install, Prisma validation/generation, lint, type-check, 281 tests, and build.

## Security and dependency setup

- Files: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`.
- Reason: patch Next.js security advisories, add Supabase SDK/CLI, enforce compatible Node, and add reproducible scripts.
- Previous: Next.js 16.2.4, Node 20 CI, no Supabase dependency or unified verification script.
- New: Next.js 16.2.10, Node 22, Supabase SDK/SSR/CLI, type-check and verify scripts.
- Risks: five moderate transitive audit findings remain; forcing fixes would require breaking Prisma or Next.js changes.
- Validation: `npm run verify` passes on Next.js 16.2.10.

## Supabase schema and security

- Files: `supabase/config.toml`, `supabase/migrations/*`, `supabase/seed.sql`, `supabase/verification/validate_migration.sql`.
- Reason: make the final database schema reproducible and secure by default.
- Previous: schema/history existed only under Prisma; destination had no tables/migrations.
- New: two aligned Supabase migrations, 19 tables, 12 enums, constraints/indexes/FKs, timestamp triggers, generated ID defaults, RLS, and server-only grants.
- Risks: destination contains no migrated Neon data.
- Validation: remote push passed; migration list 2/2; lint and advisors clean; zero integrity failures on empty destination.

## Supabase application boundary

- Files: `lib/supabase/*`, `.env.example`, `auth.ts`.
- Reason: provide typed server/browser clients, safe environment separation, sanitized error mapping, and remove unnecessary Auth.js adapter coupling.
- Previous: Prisma-only database access and Auth.js Prisma adapter.
- New: generated live database types and typed Supabase factories; Auth.js remains credentials/JWT without the unused adapter.
- Compatibility: existing repositories/services still use Prisma pending source data and transaction/query migration.
- Validation: lint, type-check, tests, and build pass.

## E2E repair

- File: `e2e/auth.spec.ts`.
- Reason: tests assumed the Email tab was default, used an ambiguous password locator, and submitted a too-short password.
- Previous: two of three browser tests failed.
- New: test asserts the default Client ID flow, explicitly selects Email, uses exact accessible labels, and waits for the bounded database fallback.
- Validation: 3/3 Playwright tests pass.

## Documentation and deployment workflow

- Files: `README.md`, `docs/phase-1/02-supabase-migration.md` through `manual-actions-required.md`.
- Reason: provide reproducible setup, migration, preview, rollback, handoff, and verification guidance.
- Previous: README described Neon/Prisma-only local development.
- New: current staged Supabase state and exact manual blockers are documented.
