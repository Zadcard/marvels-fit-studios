# Manual actions required

## Preview environment

Service: Vercel Hobby project owned by the frontend developer.

1. Import the developer's GitHub fork.
2. Set Node.js to 22 and build command to `npm run build`.
3. Add `APP_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, one public Supabase key, and `SUPABASE_SERVICE_ROLE_KEY` to Preview environment variables.
4. Use the development Supabase project values, not production values.
5. Deploy a preview branch and verify `/`, `/login`, and each authenticated role dashboard.

`NEXT_PUBLIC_*` values are browser-safe. `AUTH_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are secret and must never be exposed or committed.
