# Phase 1 Current-State Audit

Audit date: 2026-07-14

## Protected baseline

- Starting branch: `main` at `32f933f3`, matching `origin/main`.
- Working branch: `chore/phase-1-cleanup-supabase`.
- Existing uncommitted items before Phase 1: untracked `.agents/` and `.codex/agents/` directories. They are not part of this migration and must remain untouched.
- Remote: `origin` points to `https://github.com/Zadcard/marvels-fit-studios.git` for fetch and push.
- No push, merge, production deployment, remote database mutation, or Neon deletion has been performed.

## Detected stack

- Framework: Next.js 16.2.4 App Router with React 18.3.1 and TypeScript 5.
- Package manager: npm with `package-lock.json`.
- Required runtime: Node `>=20.19 <25`; `.nvmrc` selects Node 22.
- Styling/UI: Tailwind CSS 4, Radix UI, shadcn, Lucide.
- Authentication: Auth.js/NextAuth 5 beta using a credentials provider, JWT sessions, bcrypt password verification, and the Prisma adapter.
- Database: PostgreSQL accessed through Prisma 7.6 and `@prisma/adapter-pg`; the configured runtime/direct database URLs are not Supabase URLs.
- Tests: Vitest unit tests and Playwright end-to-end tests.
- Deployment: Next.js/Vercel-compatible repository; local `.vercel/` metadata is ignored. No tracked `vercel.json` is present.
- CI: GitHub Actions runs npm install, Prisma generation, ESLint, Vitest, build, and Playwright on pushes and pull requests targeting `main`.

## Repository and application boundaries

- `app/`: App Router pages, layouts, Route Handlers, and Server Actions.
- `components/`: UI components and dashboard workspaces.
- `lib/auth/`: authentication, authorization, password, and user-repository logic.
- `lib/repositories/`: dashboard and role-specific persistence adapters.
- `lib/services/`: transaction-oriented registration, attendance, booking, and session workflows.
- `lib/mocks/`: fallback/read-model data used by several repositories when database reads are unavailable.
- `prisma/`: Prisma schema, 15 migrations, and seed logic.
- `scripts/`: operational imports, audits, repairs, seeding, promotion, and smoke checks.
- `e2e/` and `tests/`: browser and supporting tests.

The UI generally calls Server Actions or server-side repositories. Database access is server-side; no current browser-side database client was found. This boundary should be preserved during migration.

## Current database architecture

The Prisma schema contains 19 models and 12 enums. The main domains are:

- Auth and identity: `User`, `Account`, `Session`, `VerificationToken`.
- Studio configuration: `StudioSettings`.
- Intake: `Lead`.
- People and organization: `Coach`, `Client`, `ClientPreferences`, `Group`.
- Billing: `Payment`, `SubscriptionPlan`, `ClientSubscription`.
- Scheduling: `TrainingSession`, `SessionBooking`, `SessionNote`.
- Client records: `SessionCompensation`, `File`, `WorkoutNote`.

The migration history preserves primary keys, unique constraints, indexes, foreign keys, enum types, defaults, and delete/update behavior. Later migrations remove the obsolete recurring `ScheduleBlock` domain and add file/note lifecycle fields.

Prisma usage is extensive: 71 non-test application/script files directly import Prisma types/client access, with additional tests and CI coupling. Auth.js also uses `@auth/prisma-adapter`. An unverified all-at-once rewrite would put authentication, transactions, nested relation queries, file downloads, and all three dashboards at risk.

## Authentication and authorization

- Credentials accept either a client ID or email plus password.
- Sessions use JWT, not database sessions at runtime.
- User role, client ID, and forced-password-change state are copied into the token/session.
- Route protection is implemented through Next.js 16 `proxy.ts` plus server-side authorization helpers.
- The Prisma adapter remains configured even though JWT sessions are used; credentials lookup and password changes still depend directly on Prisma-backed repositories.
- Supabase Auth is not currently used. Replacing Auth.js would create a second identity migration and is intentionally outside this database-only Phase 1 unless later required.

## Environment variables

Names found in ignored local environment files or source references:

- Server-only: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `VERCEL_OIDC_TOKEN`.
- Browser-safe by design: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- General/runtime: `APP_URL`, `NODE_ENV`.
- Script-only: `PDF_INPUT_PATH`, `PDF_OUTPUT_PATH`.

The ignored `.env.local` currently contains the legacy database URLs and public values for the healthy Supabase project `ggrddqflqumokoyzpjic` (`marvels-fit-studios`). The repository is not yet linked through the Supabase CLI. `AUTH_SECRET`/`NEXTAUTH_SECRET` and `APP_URL` were not found in the inspected local files.

No tracked `.env` files, service-role keys, GitHub tokens, private keys, or OpenAI-style secret keys were found. Two tracked documentation files contain example PostgreSQL URL text, not discovered live credentials.

## Deployment and workflow state

- The repository builds as a standard Next.js application with no custom output directory.
- Build command: `npm run build`.
- Start command: `npm run start`.
- Root directory: repository root.
- Node version should be 22 in Vercel and CI to match `.nvmrc` and the supported engine range.
- The tracked CI still requires `DATABASE_URL` and Prisma generation.
- The teammate-owned production Vercel project has not been modified.
- The single `origin` remote does not yet represent a fork/upstream workflow.

## Baseline validation

- `npm ci` with Node 24: passed after 865 packages were installed. The first Node 25 attempt was rejected by the engine range and an interrupted OneDrive-backed install left a partial directory; a verified removal of only `node_modules` followed by a Node 24 clean install passed.
- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run test:run`: passed, 17 files and 281 tests.
- `npm run build`: passed with Next.js 16.2.4/Turbopack.
- An initial test run before Prisma generation failed because generated `.prisma/client` files were absent; rerunning in the documented CI order passed.
- Playwright, live application smoke testing, and database smoke checks remain pending.

## Risks and findings before modification

1. **High - vulnerable framework patch.** Production dependency audit reports patched vulnerabilities affecting Next.js 16.2.4, including proxy bypass and denial-of-service advisories. Upgrade to a patched 16.2.x release without changing framework architecture.
2. **High - migration blast radius.** Prisma appears in 71 non-test files and supplies generated enums/types, nested relational queries, and transactions. Removing it without staged behavioral coverage risks broad regressions.
3. **High - remote data safety.** The Supabase project is healthy but not CLI-linked, and no Supabase database password/direct connection variable was found by name. No remote migration should run before backup/export and target confirmation.
4. **Medium - schema history contains difficult legacy transitions.** Early Prisma migrations include required-column changes and a later removal of schedule-block tables. Replaying all historical migrations directly is less reliable than a consolidated, idempotent Supabase baseline representing the final schema.
5. **Medium - authorization remains application-managed.** Auth.js credentials/JWT sessions do not map to Supabase Auth users. Browser database access would therefore lack a trustworthy Supabase user JWT. Phase 1 should keep application data access server-only and deny public PostgREST access by default.
6. **Medium - missing reproducible environment template.** No `.env.example` exists.
7. **Medium - CI and README are Prisma/Neon-specific.** Both must be updated as migration stages complete.
8. **Medium - dependency audit.** The production audit reports 13 vulnerabilities (3 high, 9 moderate, 1 low). Several are transitive through Prisma tooling; the direct Next.js issue is patchable. Remaining findings need reassessment after dependency changes.
9. **Low - Node mismatch on this machine.** System Node 25 is unsupported; use Node 22 (preferred) or another version below 25.
10. **Low - broken local skill-directory links.** Git commands warn that two `.claude/skills/` entries point to missing locations. They are tooling artifacts and not application runtime code.
