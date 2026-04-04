# Marvel Fit Studios

This project is currently set up for local development only.

- Database: Neon Postgres
- App stack: Next.js + NextAuth/Auth.js + Prisma

Legacy static-site files and database reference snapshots are preserved under `archive/` and are not part of the active runtime.

## Required Environment Variables

Set these in your local `.env`:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` should be your Neon connection string.
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
