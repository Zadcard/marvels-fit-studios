# Phase 1 Supabase Migration Design

## Architecture

The application will remain a Next.js server-oriented system. Auth.js credentials and JWT sessions continue to define identity and roles, while Supabase replaces Neon as the PostgreSQL platform. Because Auth.js tokens are not Supabase Auth tokens, application tables will not be exposed directly to browser clients in Phase 1. Server Actions, Route Handlers, and server components will continue to call repository/service boundaries; those boundaries will use a typed server-only Supabase client or a temporary Prisma-on-Supabase compatibility path.

The database schema will be represented by consolidated Supabase SQL migrations derived from the final Prisma model and the effective end state of all Prisma migrations. This avoids replaying legacy migrations that add required columns to populated tables or create then later remove obsolete domains. Row Level Security will be enabled with no anonymous/authenticated policies for application tables until a trustworthy Supabase Auth mapping exists. Server credentials, if needed, stay server-only.

## Data flow and migration safety

Schema and data moves are separate operations. First, inventory the Neon source with read-only queries and produce a logical backup/export. Next, create and validate the destination schema in the development Supabase project. Then import data in dependency order and validate counts, required fields, unique keys, foreign keys, enum values, representative records, and critical application queries. Neon remains available for rollback.

The initial runtime cutover may point Prisma at Supabase to validate unchanged application behavior. That compatibility stage is not the final architecture: remaining Prisma imports will be counted and documented. Simple read/write repositories can then move to the typed Supabase boundary, while complex transactions and Auth.js-related persistence remain until they have equivalent tests or database functions.

## Error handling and verification

Environment parsing will fail clearly on missing server configuration without leaking values. Supabase errors will be mapped centrally rather than passed raw to the UI. Existing repository fallbacks will be preserved only where they are intentional product behavior; write errors will not be swallowed.

Every change group must pass ESLint, TypeScript, Vitest, and the Next.js production build. Database migrations must pass local reset/diff checks before remote use. Remote validation must be read-only or transactionally rolled back until the user explicitly authorizes destructive or production actions. Preview deployments use a separate Vercel Hobby project and the development Supabase project; the teammate-owned production deployment and its domain remain untouched.

