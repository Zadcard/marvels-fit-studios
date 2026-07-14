# Deployment workflow

The existing production Vercel project remains owned and controlled by the backend teammate. This phase did not push, deploy, transfer, or alter production.

## Free preview workflow

1. Fork the GitHub repository to the frontend developer account.
2. Import that fork into a separate Vercel Hobby project.
3. Use Node 22, npm install, `npm run build`, and the repository root.
4. Add `APP_URL`, `AUTH_SECRET`, `CRON_SECRET`, the public Supabase variables, and `SUPABASE_SERVICE_ROLE_KEY` to Preview only.
5. Point preview to the development Supabase project, never production data.
6. Open pull requests back to the main repository; production remains with its current owner.

Rollback a preview by promoting a previous successful preview deployment or reverting the feature branch. Production rollback remains the production owner's responsibility.

The repository includes an hourly Vercel Cron definition in `vercel.json`. It calls `/api/cron/studio-automation`; Vercel must have a server-only `CRON_SECRET` configured before enabling the deployment. The job creates in-app reminders and records every execution in `AutomationRun`.
