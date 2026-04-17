# Marvel Fit Studios

This project is currently set up for local development only.

- Database: Neon Postgres
- App stack: Next.js + NextAuth/Auth.js + Prisma

Legacy static-site files and database reference snapshots are preserved under `archive/` and are not part of the active runtime.

## Required Environment Variables

Set these in your local `.env`:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` should be your pooled Neon connection string using the `-pooler` host and `sslmode=require`.
- `DIRECT_URL` should be your direct Neon connection string without the `-pooler` host. Prisma CLI operations use this when present; the app runtime continues to use `DATABASE_URL`.
- `AUTH_SECRET` is required for Auth.js session security.
- `APP_URL` is used as the metadata base URL locally. If omitted, the app falls back to `http://localhost:3000`.
- `AUTH_URL` or `NEXTAUTH_URL` is not required by default because host detection is handled through Auth.js with `trustHost: true`.

## Local Setup

Use Node `22` from [`.nvmrc`](./.nvmrc).

```bash
nvm use
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Optional Seed Data

If you want demo users in your database:

```bash
npx prisma db seed
```

## Promote Leads To Clients

If a person signed up through `Join Now`, they are stored in `Lead` and cannot log in until they are promoted into a real `User` + `Client`.

Use the bulk promotion script:

```bash
npm run promote:leads -- --all
```

To preview changes without writing anything:

```bash
npm run promote:leads -- --all --dry-run
```

To convert a single lead by email:

```bash
npm run promote:leads -- --email user@example.com
```

What the script does:

- creates a `User` if one does not exist
- reuses the lead password hash for credentials login
- creates a linked `Client` profile
- marks the `Lead` as `CONVERTED`

Seeded demo accounts:

- `admin@test.com`
- `coach@test.com`
- `client@test.com`

Password for all seeded demo users:

```bash
password123
```

## Database Workflow

After schema changes, run:

```bash
npx prisma migrate deploy
```

The project build already runs `prisma generate` automatically through `prebuild`.

## Current Database Domains

The schema now covers:

- Auth and users
- Landing leads
- Coaches, clients, groups, payments, files, and workout notes
- Training sessions and session bookings
- Subscription plans and client subscriptions

The new session and subscription tables are introduced by the migration at
`prisma/migrations/20260408103000_add_session_and_subscription_domain/`.

If you want demo data for the new domain tables, run:

```bash
npx prisma db seed
```

## Verification Checklist

Run these before pushing a deployment change:

```bash
npx prisma generate
npm run build
```

Then verify the login flow and role redirects for:

- admin -> `/admin`
- coach -> `/coach`
- client -> `/client`
