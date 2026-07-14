# Backend handoff

## Do not reverse these decisions

- Supabase is the only database runtime.
- Auth.js credentials and JWT sessions remain the auth layer.
- Browser code must not receive the service-role key or direct table access.
- Multi-table writes stay in version-controlled SQL functions with restricted execution.
- The development database intentionally begins empty.
- Recurring, automation, transformation, and ledger changes must continue through forward-only Supabase migrations.
- `CRON_SECRET` is server-only and must match the Vercel Cron bearer token.

## Routine workflow

1. Create a new file with `npx supabase migration new descriptive_name`.
2. Apply and test locally with `npm run supabase:reset` when Docker is available.
3. Link the intended development project and inspect `npm run supabase:migrations`.
4. Apply the migration, regenerate `lib/supabase/database.types.ts`, and run `npm run verify`.
5. Review SQL and application changes in a pull request before production promotion.

Required runtime secrets are `AUTH_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`; public project values are documented in `.env.example`.

Also configure `CRON_SECRET` for deployed automation. The service-role client is the only code allowed to call restricted workflow functions. Do not add `service_role` to browser bundles or relax table grants to `anon`/`authenticated` without a separate RLS design review.

After schema changes, run `npm run supabase:types`, `npm run supabase:lint`, `npm run supabase:verify-roadmap`, and `npm run verify`. The roadmap verifier uses temporary synthetic rows and removes them in `finally`; run it only against an intended development/preview project.

Do not remove the root `postcss` override until Next.js itself depends on PostCSS 8.5.10 or newer. CI independently rebuilds the Supabase local database on Ubuntu/Docker, so migration pull requests must keep the `supabase-schema` job green.
