# Manual actions required

## Preview environment

Service: Vercel Hobby project owned by the frontend developer.

1. Import the developer's GitHub fork.
2. Set Node.js to 22 and build command to `npm run build`.
3. Open Vercel project **Settings > Environment Variables** and add `APP_URL`, `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, one public Supabase key, and `SUPABASE_SERVICE_ROLE_KEY` for Preview.
4. Use the development Supabase project values, not production values.
5. Deploy a preview branch and verify `/`, `/login`, and each authenticated role dashboard.
6. Open **Settings > Cron Jobs** (or the deployment's Cron tab), confirm `/api/cron/studio-automation` uses `0 * * * *`, trigger it once, and verify the response is 200 plus a successful `AutomationRun` row.

`NEXT_PUBLIC_*` values are browser-safe. `AUTH_SECRET`, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` are secret and must never be exposed or committed.
