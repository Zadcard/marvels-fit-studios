# Environment setup

## Requirements

- Node 22 and npm
- Docker Desktop only when running the full local Supabase stack
- A Supabase project for linked remote development

## Variables

Public:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`

Application:

- `APP_URL`

Copy `.env.example` to `.env.local` and fill values without committing that file.

## Commands

```bash
npm ci
npm run supabase:start
npm run supabase:reset
npm run dev
```

Linked project checks:

```bash
npm run supabase:migrations
npm run supabase:lint
npm run supabase:types
```

If local Supabase reports a Docker error, start Docker Desktop first. Linked migration and type-generation commands do not require the local stack.
