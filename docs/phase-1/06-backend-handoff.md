# Backend handoff

## Do not reverse these decisions

- Supabase is the only database runtime.
- Auth.js credentials and JWT sessions remain the auth layer.
- Browser code must not receive the service-role key or direct table access.
- Multi-table writes stay in version-controlled SQL functions with restricted execution.
- The development database intentionally begins empty.

## Routine workflow

1. Create a new file with `npx supabase migration new descriptive_name`.
2. Apply and test locally with `npm run supabase:reset` when Docker is available.
3. Link the intended development project and inspect `npm run supabase:migrations`.
4. Apply the migration, regenerate `lib/supabase/database.types.ts`, and run `npm run verify`.
5. Review SQL and application changes in a pull request before production promotion.

Required runtime secrets are `AUTH_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`; public project values are documented in `.env.example`.
