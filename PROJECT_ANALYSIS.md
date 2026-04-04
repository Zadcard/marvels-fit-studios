# Marvel's Fit Studios Project Analysis

Last reviewed: 2026-04-04

## Executive Summary

The project is currently strongest as a polished frontend prototype with a real authentication foundation.

- The public landing page is well built and brand-ready.
- Role-based authentication is partially implemented with `Auth.js` + `Prisma` + `Neon`.
- The admin, coach, and client dashboards are visually extensive, but most dashboard data and actions are still mock-driven.
- The database schema is meaningful and points in the right direction, but the app has not yet been wired into a real application backend beyond login/session setup.

Short version:

- Marketing website: mostly ready.
- Login flow: partially real.
- Dashboards: mostly frontend prototype.
- Backend business logic: still early.
- Deployment direction: correct for `Vercel + Neon + Prisma`.

## Current Stack

- Frontend: `Next.js 15.5.14` App Router
- UI: custom design system + Tailwind 4 + shadcn-style component setup
- Auth: `next-auth@5 beta` / Auth.js with Credentials provider
- ORM: `Prisma 7`
- Database: `PostgreSQL` intended for `Neon`
- Hosting target: `Vercel`
- Analytics: `@vercel/analytics`

## What Has Been Built

### 1. Public website

Implemented:

- Branded landing page at `/`
- Responsive marketing sections
- Brand typography and styling
- Social/contact links
- polished visual direction

Assessment:

- This is one of the most complete parts of the project.
- It feels production-oriented from a design perspective.
- The contact/join flow is still only a frontend form and is not connected to backend persistence or notification workflows yet.

### 2. Authentication foundation

Implemented:

- Auth.js route handler in `app/api/auth/[...nextauth]/route.ts`
- Credentials login via `auth.ts`
- Prisma adapter configured
- JWT/session callbacks with role injection
- route protection and role redirects in `proxy.ts`
- local demo fallback users for development

What is real:

- user lookup through Prisma in `auth.ts`
- bcrypt password comparison
- session role propagation
- protected route redirection by role

What is still incomplete:

- no signup flow
- no forgot-password/reset-password flow
- no logout UX surfaced in the dashboards
- no admin-managed user lifecycle
- no full authorization/data-access layer yet

Important environment note:

- `.env` currently contains `DATABASE_URL`
- `AUTH_SECRET` is missing and is still required for proper Auth.js production setup

### 3. Dashboard architecture

Implemented:

- role-separated portals:
  - `/admin`
  - `/coach`
  - `/client`
- shared dashboard shell
- topbar/sidebar navigation
- many screen-specific workspace components
- strong UI structure for future CRUD flows

Assessment:

- The dashboard system is broad in coverage and good as a product prototype.
- The navigation and screen decomposition are clean enough to support future backend wiring.
- However, the vast majority of these screens are not connected to real data yet.

### 4. Database schema

Implemented:

- unified `User` model with `role`
- Auth.js standard tables: `Account`, `Session`, `VerificationToken`
- domain models:
  - `Coach`
  - `Client`
  - `Group`
  - `Payment`
  - `SessionCompensation`
  - `File`
  - `WorkoutNote`

Assessment:

- The schema is a good start.
- It matches the intended product better than the older schema.
- There was a real refactor from old auth tables to unified Auth.js-style auth, which is the right direction.

Missing at the schema/domain level:

- a first-class `Session` domain model for gym/training sessions separate from Auth sessions
- attendance tracking
- bookings/reservations
- subscription plan model normalization
- invoice/payment transaction detail
- audit trail / action logs
- onboarding leads/contact submissions
- notifications/reminders model if needed later

## What Is Still Mock / Frontend-Only

The clearest pattern in the repo is that the dashboards are mostly powered by `lib/mocks/*`.

Confirmed indicators:

- nearly every dashboard workspace imports from `@/lib/mocks/...`
- several files explicitly say `mock-only`, `frontend phase`, or similar wording
- admin overview literally labels part of the data as `Mock schedule`
- login page says password recovery will be added later

This means the current project status is:

- not yet a full studio management system
- currently a strong UX/UI prototype with a working auth shell

## What Is Actually Wired to the Backend Today

Real backend-connected areas:

- credentials login
- Prisma user lookup
- password verification
- Auth.js session creation
- role-aware route protection
- seed script for demo users

Not yet wired:

- client CRUD
- coach CRUD
- group management
- session scheduling
- session attendance
- payment management
- subscription renewals
- profile saving
- settings persistence
- contact form submission
- file uploads/storage flow
- workout note persistence

## Project Maturity: Where We Are Now

I would place the project roughly here:

- UI/UX maturity: `75%`
- auth/platform foundation: `45%`
- backend/domain implementation: `20%`
- production readiness overall: `35%`

Interpretation:

- the product shape is visible
- the architecture direction is mostly correct
- the business engine is still ahead of us

## Main Gaps Blocking Production

### Functional gaps

- no real business CRUD flows
- no real session scheduling system
- no real membership/subscription engine
- no booking/attendance logic
- no billing/payment workflow beyond mock UI
- no real profile/settings persistence

### Architecture gaps

- no dedicated data access layer
- no service layer for business rules
- no server actions or route handlers for domain operations
- no validation layer around mutations besides login credentials
- no clear separation between mock UI state and real persisted state

### Operational gaps

- `AUTH_SECRET` not configured locally
- ESLint is currently broken
- build is blocked in this environment because `prisma generate` needs Prisma engine download access
- no test suite coverage for auth or core flows

## Verification Performed During This Review

Reviewed:

- project structure
- Next.js local docs under `node_modules/next/dist/docs`
- package/dependency setup
- auth configuration
- proxy/route protection
- Prisma schema, migrations, and seed
- dashboard routes/components
- mock data usage patterns

Command results:

- `npm run lint`
  - failed due to ESLint config error: circular structure serialization in the current config stack
- `npm run build`
  - failed at `prisma generate`
  - in this environment Prisma attempted to fetch engine binaries and hit a network refusal

## Recommended Backend Direction

For this project, the best backend choice is:

**Use Next.js itself as the backend-for-frontend, with Prisma on Neon, deployed on Vercel.**

That means:

- keep `Next.js App Router`
- keep `Auth.js`
- keep `Prisma + Neon Postgres`
- implement domain mutations using:
  - `Server Actions` for form-driven mutations inside the app
  - `Route Handlers` for APIs needed by external clients, uploads, webhooks, or special integrations

### Why this is the right fit

- simplest deployment path on Vercel
- no need to maintain a separate Express/Nest backend right now
- Prisma fits Neon/Postgres naturally
- auth/session handling already lives inside the Next app
- the project is dashboard-heavy, so server components + server actions are a strong fit

### Recommended backend structure

Use this shape:

- `lib/auth/`
  - session helpers
  - role guards
- `lib/db/`
  - Prisma client
  - query helpers
- `lib/dal/`
  - server-only data access per domain
- `lib/services/`
  - business rules
- `app/(dashboard)/...`
  - pages and UI only
- `app/actions/`
  - server actions for mutations
- `app/api/`
  - route handlers only where needed
- `lib/validators/`
  - `zod` schemas for inputs

### How to decide between Server Actions and Route Handlers

Use `Server Actions` for:

- create/edit client
- create/edit coach
- update profile/settings
- create session
- approve compensation
- record payment
- attach workout note

Use `Route Handlers` for:

- Auth.js endpoints
- upload callbacks / UploadThing integration
- webhooks
- mobile/external API access if you add it later
- background/integration endpoints

## Recommended Domain Build Order

Build in this order:

1. Auth hardening
- add `AUTH_SECRET`
- remove dependence on demo fallback for non-dev production behavior
- add logout flow
- add basic user/account management rules

2. Data access layer
- create server-only DAL modules for users, coaches, clients, groups, payments
- move future queries out of UI components

3. Admin core CRUD
- real client management
- real coach management
- group assignment

4. Training session domain
- create a dedicated training session model
- scheduling
- bookings
- attendance
- compensation handling

5. Subscription and billing
- replace mock subscription data with real plan/payment records
- define overdue/paid/trial states from persisted data

6. Client and coach portals
- connect their dashboards to real DB records
- remove hard-coded names/avatars/prompts from navigation metadata

7. Contact and lead capture
- save landing page submissions
- optionally notify via email/WhatsApp/admin inbox

8. Files and notes
- connect UploadThing or Vercel Blob/S3-compatible storage
- store metadata in Postgres

## What I Would Do Next

If we continue from here, the best next milestone is:

**Turn the admin portal from mock UI into real CRUD for coaches, clients, and groups.**

That gives the project a real operational core quickly.

Concrete next tasks:

1. fix lint/config stability
2. add `AUTH_SECRET` and confirm production auth envs
3. introduce a real training-session schema
4. create DAL + service modules
5. replace `lib/mocks/admin-clients.ts` with Prisma-backed reads/writes
6. replace `lib/mocks/admin-coaches.ts` with Prisma-backed reads/writes
7. connect admin overview cards to real aggregate queries

## Honest Overall Opinion

The project is good.

More specifically:

- the product direction is clear
- the UI work is strong
- the dashboard decomposition is thoughtful
- the deployment stack choice is correct

But:

- it is not close to backend-complete yet
- the current breadth of dashboard screens may create the illusion of more completion than actually exists
- the next phase should be less about adding new pages and more about converting existing pages from mock state to real domain logic

My honest read:

- this is a strong foundation for a serious product
- you are past the blank-page phase
- you are not yet in production-hardening phase
- you are in the most important middle phase: **turning a convincing prototype into a real application**

## Final Recommendation

Use this backend stack:

- `Next.js App Router` as the app and backend-for-frontend
- `Auth.js` for authentication
- `Prisma` for ORM
- `Neon Postgres` for database
- `Server Actions` for most dashboard mutations
- `Route Handlers` for integrations/webhooks/uploads/special APIs

Do **not** add a separate backend service yet unless:

- you need a public API for multiple clients
- you add heavy async processing/microservices
- team size grows enough to justify backend separation

Right now, a single well-structured Next.js codebase is the best choice.
