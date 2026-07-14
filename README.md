# Marvel Fit Studios

Next.js 16 application for the Marvel Fit Studios admin, coach, and client portals.

## Phase 1 database status

- Destination: Supabase Postgres project `marvels-fit-studios`.
- Version-controlled schema: `supabase/migrations/`.
- Authentication: Auth.js credentials with JWT sessions; Supabase Auth is intentionally disabled for signups.
- Security: application tables have RLS enabled and no browser-role policies. Runtime access is server-only.
- Compatibility: Prisma still powers existing repositories/services while Neon data export and behavioral migration are pending. The unnecessary Auth.js Prisma adapter has been removed.
- Source safety: Neon has not been deleted or modified.

See [`docs/phase-1/`](./docs/phase-1/) for the audit, migration guide, environment setup, deployment workflow, handoff, and verification report.

## Requirements

- Node 22 (`.nvmrc`)
- npm
- Docker Desktop for the full local Supabase stack
- Supabase CLI (installed as a dev dependency)

## Local setup

```bash
nvm use
npm ci
copy .env.example .env.local
npm run supabase:start
npm run supabase:reset
npm run dev
```

Fill `.env.local` with development values only. Never commit real secrets. Until data migration is complete, `DATABASE_URL` and `DIRECT_URL` are the temporary Prisma compatibility connections and should point to the development Supabase project—not production.

## Validation

```bash
npm run verify
npm run test:e2e
npm run supabase:migrations
npm run supabase:lint
npm run supabase:validate
```

`npm run verify` runs ESLint, TypeScript, Vitest, and the production build. The E2E suite starts the app and checks the landing/login/invalid-credentials flows.

## Database workflow

Create migrations locally rather than editing hosted tables in the dashboard:

```bash
npx supabase migration new descriptive_name
npm run supabase:reset
npm run supabase:types
npm run verify
```

Review schema changes, open a pull request, and apply them to the development project before production. Production migration commands and rollback rules are documented in [`docs/phase-1/02-supabase-migration.md`](./docs/phase-1/02-supabase-migration.md).

## Important boundaries

- Never put `SUPABASE_SERVICE_ROLE_KEY`, database URLs, passwords, or Auth.js secrets in client code.
- Do not add browser table policies while identity is managed by Auth.js unless a verified JWT/RLS design is approved.
- Do not remove Neon until Supabase data counts, integrity checks, application queries, and role flows all pass and removal is explicitly approved.
- Do not remove Prisma until repository scans reach zero and transaction/auth behavior has equivalent coverage.
