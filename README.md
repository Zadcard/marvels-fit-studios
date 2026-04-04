# Marvel Fit Studios

This project is now aligned to one deployment path only:

- Hosting: Vercel
- Database: Neon Postgres
- App stack: Next.js + NextAuth/Auth.js + Prisma

Firebase Hosting, Firebase Functions, Firestore, and Firebase Data Connect are not part of the active deployment path anymore.

## Required Environment Variables

Set these in Vercel for Production, Preview, and Development as needed:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="replace-with-a-long-random-secret"
```

Notes:

- `DATABASE_URL` should be your Neon connection string.
- `AUTH_SECRET` is required for Auth.js session security.
- `AUTH_URL` or `NEXTAUTH_URL` is not required by default on Vercel for this app because host detection is handled through Auth.js with `trustHost: true`.

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

## Vercel Deployment

1. Create a Neon database and copy its connection string.
2. Add `DATABASE_URL` and `AUTH_SECRET` in the Vercel project settings.
3. Import this repository into Vercel.
4. Deploy.
5. After schema changes, run:

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

This keeps the current auth and dashboard structure intact while deploying on the free Vercel + Neon path.
