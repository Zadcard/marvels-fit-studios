# Manual Actions Required

Only actions that could not be completed safely from the terminal are listed.

## 1. Provide a read-only Neon source connection

- Service: Neon Console
- Navigation: Project > Branches > select the production/source branch > Connect
- Field: connection string for the correct database and a role that can read all application tables
- Requested variable name: `NEON_DATABASE_URL`
- Exposure: secret; do not paste it into Git, issues, screenshots, or public chat
- Storage: local ignored `.env.local` or a secure one-time secret channel; it will be used only for source inventory/export
- Why: the current local database variables are placeholders and fail with `ENOTFOUND base`; backup and data migration cannot proceed
- Verify: `pg_dump --dbname $env:NEON_DATABASE_URL --schema-only --no-owner --no-privileges --file $env:TEMP\marvels-neon-schema.sql` completes without changing Neon

## 2. Add the Supabase server/runtime secrets

- Service: Supabase Dashboard
- Navigation for API key: Project `marvels-fit-studios` > Project Settings > API Keys
- Field: service-role key (or the current server secret key with equivalent privileged server access)
- Variable: `SUPABASE_SERVICE_ROLE_KEY`
- Exposure: secret; server-only
- Storage: ignored `.env.local` and later Vercel Preview/Production secret environment storage
- Why: existing Auth.js identities require a trusted server client; public keys are intentionally denied by RLS
- Verify: run a server-only read of an empty application table; never test it from browser DevTools

- Navigation for database URLs: Project > Connect > ORMs > Prisma / Connection string
- Fields: transaction-pooler runtime URL and direct/session-pooler migration URL
- Variables: `DATABASE_URL`, `DIRECT_URL`, and `SUPABASE_DB_URL`
- Exposure: secret
- Storage: ignored `.env.local`; preview values only in the personal Vercel project
- Why: existing Prisma repositories need Supabase connections during the compatibility cutover, and PostgreSQL tools need a restore target
- Verify: `npx prisma db pull --print` can introspect without modifying the database; do not save its output over the checked-in schema

## 3. Install/start Docker Desktop for local database verification

- Service: Docker Desktop for Windows
- Navigation: install from the official Docker site, then Docker Desktop > Start
- Field/button: ensure the engine status is Running
- Exposure: no secret
- Storage: local machine only
- Why: Supabase local start/reset and Docker-backed catalog operations require it
- Verify: `docker version`, then `npm run supabase:start` and `npm run supabase:reset`

## 4. Create the personal preview deployment

- Services: GitHub and Vercel
- GitHub navigation: official repository > Fork > Create fork under the frontend developer account
- Vercel navigation: Add New > Project > Import the fork
- Settings: Next.js preset, root repository directory, `npm ci`, `npm run build`, Node 22.x
- Environment values: all variables listed in `04-deployment-workflow.md`, using development Supabase only
- Exposure: public only for `NEXT_PUBLIC_*`; all other values secret
- Storage: Vercel project environment settings scoped to Preview/Development
- Why: external account ownership and project connection cannot be created safely from this terminal, and production ownership must remain unchanged
- Verify: open the generated preview URL, check landing/login, and confirm the deployment's Supabase URL is the development project

