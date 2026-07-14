# Deployment Workflow

## Existing production boundary

The existing official Vercel project is owned by the backend teammate. This Phase 1 run did not inspect or modify its settings, domains, environment variables, deployments, or ownership. No production deployment was triggered.

## Recommended free preview model

1. Keep the official repository and teammate-owned Vercel project as the production authority.
2. Fork the GitHub repository into the frontend developer's account.
3. Add the official repository as `upstream`; keep the fork as `origin` in the frontend checkout.
4. Import the fork into a separate Vercel Hobby project owned by the frontend developer.
5. Configure Preview/Development environment variables with the development Supabase project only.
6. Work on feature branches and open pull requests to the official repository.
7. Let the production owner merge/deploy approved changes.

Suggested Git remotes after creating the fork:

```powershell
git remote rename origin upstream
git remote add origin https://github.com/YOUR_ACCOUNT/marvels-fit-studios.git
git remote -v
```

Do not run these commands until the fork exists and the developer confirms their GitHub account.

## Vercel project settings

- Framework preset: Next.js
- Root directory: repository root
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: leave unset (Next.js default)
- Node.js: 22.x
- Production branch for the personal preview project: the fork's `main`

Preview environment variables:

- `APP_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` and `DIRECT_URL` pointing to development Supabase during Prisma compatibility

Never copy production database values into the personal preview project.

## Pull request flow

```powershell
git switch -c feature/short-description
git push -u origin feature/short-description
```

Open a pull request from the fork branch to the official repository's `main`. Vercel will create a shareable preview URL for the personal project. Inspect build logs and delete obsolete preview deployments from Vercel Dashboard > Project > Deployments > deployment menu > Delete.

## Production and rollback

Only the production owner should promote an approved commit. Apply reviewed migrations to the production Supabase project first, validate the database, configure production-only variables, deploy, and smoke test all roles. Roll back the application by redeploying the last known-good Vercel deployment. Correct database problems with a forward migration; never edit applied migration history or reset a hosted database.

