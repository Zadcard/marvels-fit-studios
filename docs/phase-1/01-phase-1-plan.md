# Phase 1 Plan

Last updated: 2026-07-14

## Architecture decision

Use a staged server-only migration.

1. Preserve Auth.js credentials and JWT sessions. Do not introduce Supabase Auth during Phase 1.
2. Treat Supabase Postgres as the destination database and keep Neon as the rollback source.
3. Store a consolidated representation of the final schema in version-controlled Supabase migrations. Do not replay destructive legacy transitions against the destination.
4. Add a server-only Supabase client boundary, generated database types, centralized environment validation, and deny-by-default Row Level Security policies.
5. Keep browser database access disabled because current Auth.js JWTs are not Supabase Auth JWTs. The public client configuration is reserved for a later, explicitly designed authenticated use case.
6. Use Prisma temporarily against Supabase only for application paths that cannot be safely converted and verified in this Phase 1 pass. Track every remaining import. Do not call this final removal complete while imports remain.

## Considered approaches

### A. All-at-once Prisma-to-PostgREST rewrite

This would satisfy the desired end state immediately, but it would require translating nested queries and transactions across 61 non-test files plus authentication and operational scripts. Existing tests mock Prisma shapes, so passing tests could conceal relational or transactional differences. Rejected as too risky for a behavior-preserving cleanup phase.

### B. Point Prisma at Supabase and stop

This is the lowest-risk database move and removes Neon runtime use, but it does not establish the requested Supabase architecture or meaningfully reduce Prisma coupling. Rejected as the final design, retained only as a bounded compatibility step.

### C. Staged server-only migration (selected)

Establish the reproducible Supabase schema, security posture, server client, migration/validation tooling, and environment/deployment model first. Move safe data paths to Supabase and use a documented compatibility layer for transaction-heavy paths until equivalent tests and remote validation exist. This preserves behavior while making remaining work measurable.

## Work board

| Area | Status | Notes |
| --- | --- | --- |
| Protect Git baseline and create branch | Complete | Pre-existing untracked tooling directories preserved. |
| Repository and dependency audit | Complete | Baseline documented in `00-current-state-audit.md`. |
| Baseline lint/type/test/build | Complete | All pass after Prisma client generation. |
| Patch vulnerable direct dependencies | In progress | Upgrade only patched compatible releases. |
| Supabase CLI scaffold | Pending | Add config, migrations, seed, and scripts. |
| Consolidated final schema | Pending | Derived from final Prisma schema plus migration-only constraints. |
| RLS and grants | Pending | Deny public access because app auth is not Supabase Auth. |
| Generated database types | Pending | Generate locally or provide deterministic checked-in equivalent pending link credentials. |
| Server Supabase boundary | Pending | Server-only, typed, no service role in browser code. |
| Neon export and validation tooling | Pending | Read-only inventory first; no remote writes without backup. |
| Supabase link and remote schema migration | Blocked | Requires verified database credentials/backup; target project ref is known. |
| Remote data migration | Blocked | Must remain separate from schema migration and require a rollback-safe export. |
| Prisma data-access replacement | Pending | Migrate only paths with adequate behavioral verification. |
| Prisma/Neon dependency removal | Pending | Remove only after usage reaches zero; otherwise document bounded blocker. |
| Environment and README updates | Pending | Add `.env.example` and exact setup. |
| Preview deployment workflow | Pending | Repository-side workflow/docs only; production untouched. |
| Playwright and manual smoke testing | Pending | Run after architecture changes. |
| Final verification/handoff | Pending | Complete all Phase 1 reports. |

## Migration sequence

1. Patch the vulnerable Next.js release and rerun lint, type-check, tests, and build.
2. Create `supabase/config.toml`, consolidated schema migration, security/RLS migration, seed guidance, and data validation SQL.
3. Add environment validation, server-only Supabase client utilities, and generated database types.
4. Prepare read-only Neon inventory/export and Supabase import/validation commands. Never delete or disable Neon.
5. Link only to project `ggrddqflqumokoyzpjic` after confirming credentials and backup readiness.
6. Apply schema to the development Supabase project, migrate data, and compare row counts, nulls, uniqueness, foreign keys, representative records, and application queries.
7. Repoint the compatibility database URL to Supabase for server-side Prisma paths.
8. Replace Prisma paths in bounded groups, beginning with simple repositories and keeping transaction-heavy/auth paths until equivalent tests exist.
9. Remove Prisma packages/config/schema only when repository scans report zero runtime/test/script usage.
10. Update CI, environment examples, deployment workflow, handoff, and verification report.

## Validation approach

- Static: ESLint, TypeScript, Next.js build, secret/boundary scans, Prisma/Supabase usage scans.
- Unit: full Vitest suite after each architectural group.
- Database: migration dry-run/local reset, schema diff, row counts, null checks, uniqueness, foreign-key integrity, and representative queries.
- Application: role login/redirects, dashboard loading for admin/coach/client, lead intake, client registration, scheduling/bookings, settings, notes/files, and password change.
- Deployment: non-production preview only, using a development Supabase project and preview-scoped environment variables.

## Rollback strategy

- Keep Neon online and unchanged as the source of truth until Supabase validation and explicit production approval.
- Take a logical export before any remote Supabase import.
- Apply schema through versioned migrations, not dashboard-only changes.
- Use a separate preview/development Supabase project; do not point preview builds at production data.
- Revert application environment variables to the Neon URLs if the Supabase compatibility stage fails.
- Do not remove Prisma schema/history until all Prisma usage is zero and a clean build/test/database validation passes.

