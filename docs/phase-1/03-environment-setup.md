# Environment Setup

## Required tools

- Node 22 and npm
- Docker Desktop for local Supabase
- Supabase CLI (repository dev dependency)
- PostgreSQL client tools (`psql`) for optional database diagnostics

```powershell
nvm use 22
npm ci
npx supabase --version
psql --version
```

The machine used for Phase 1 had system Node 25, which is outside the supported range. A bundled Node 24 runtime was used for verification. Teammates should use the repository-standard Node 22.

## Environment variables

Copy `.env.example` to `.env.local`. Real values must remain ignored.

### Browser-safe public values

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred for new Supabase keys)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy fallback)

These are safe to embed in browser bundles only because RLS/grants protect data. They are not a substitute for RLS.

### Server-only secrets

- `AUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `VERCEL_OIDC_TOKEN` when Vercel supplies it

Never prefix server-only variables with `NEXT_PUBLIC_`.

### Other values

- `APP_URL`: `http://localhost:3000` locally, the preview origin in preview, and the official origin in production.
- `PDF_INPUT_PATH`, `PDF_OUTPUT_PATH`: optional operational script paths.

## Local Supabase

```powershell
npm run supabase:start
npm run supabase:reset
npm run supabase:types
npm run supabase:stop
```

`supabase:reset` is safe only for the local Docker database. It must never be adapted to `--linked`. Docker Desktop was not available during this run, so local reset was not executed; the migrations were instead applied and linted on the empty hosted development project.

## Start and verify the application

```powershell
npm run dev
npm run verify
$env:AUTH_SECRET='local-test-only-value'
npm run test:e2e
```

Use a real local `AUTH_SECRET` for routine development. The inline value above is only an example for a disposable test process.

## Teammate setup

1. Checkout the Phase 1 branch or approved PR.
2. Install Node 22 and Docker Desktop.
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local`.
5. Add development—not production—Supabase public values, service key, and pooler/direct URLs.
6. Run `npx supabase login` and `npx supabase link --project-ref ggrddqflqumokoyzpjic`.
7. Confirm `npm run supabase:migrations` shows the same two local/remote versions.
8. Run `npm run verify` and `npm run test:e2e`.

## Troubleshooting

- `EBADENGINE` with Node 25: switch to Node 22 and rerun `npm ci`.
- `Cannot find module .prisma/client/default`: run `npx prisma generate` while the compatibility layer remains.
- Docker pipe/daemon error: start Docker Desktop; hosted schema verification can still use `--linked`.
- `P1001` or `ENOTFOUND base`: `DATABASE_URL` is missing/placeholder or the database is unreachable.
- Browser client reports missing key: set one of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server client reports missing key: add `SUPABASE_SERVICE_ROLE_KEY` only to server/local/Vercel secret storage.
