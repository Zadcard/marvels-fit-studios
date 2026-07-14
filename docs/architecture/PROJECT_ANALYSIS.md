# Marvel's Fit Studios Project Analysis

Last reviewed: 2026-04-04

## Executive Summary

The project is in a better place than the previous review.

There is now real architectural progress on the backend side, especially around authentication and code organization, but the product is still mostly a polished frontend prototype outside the auth layer.

Current high-level status:

- marketing site: strong
- login/auth shell: real and improved
- role protection: real and improved
- dashboard architecture: cleaner than before
- dashboard business data: still mostly mock
- true backend domain logic: still early

## What Changed Since the Previous Analysis

These are the most important improvements in the current codebase:

### 1. Authentication code is more structured now

The auth logic is no longer concentrated in one file only.

New backend-oriented abstractions now exist in `lib/auth/`:

- credential parsing
- password verification
- demo fallback policy
- user repository abstraction
- credentials auth service
- authorization policy helpers

This is a real improvement because the auth layer now has:

- better separation of concerns
- clearer testability
- easier future extension

### 2. Route protection is more mature

`proxy.ts` is now driven by `authorization-policy.ts` instead of only manual path checks.

That means:

- route intent is clearer
- dashboard home redirects are centralized
- role mapping is cleaner

This is better than the earlier version.

### 3. Role layouts are now enforced at the server layout level

Each dashboard area now has its own layout that calls `auth()` and validates the user role:

- admin layout
- coach layout
- client layout

This is important because it adds another security/control layer beyond proxy-based redirects.

### 4. Dashboard code has started moving toward reusable workspace patterns

There is now early abstraction in:

- `lib/dashboard/workspace-definition.ts`
- `lib/dashboard/use-managed-records.ts`
- `lib/dashboard/admin-client-workspace.ts`

This means the team has started organizing repeated dashboard behavior instead of duplicating raw UI logic everywhere.

### 5. Repository pattern has started

There is now at least one explicit repository abstraction in:

- `lib/repositories/admin-client-repository.ts`

But:

- it still returns mock data
- it is not yet a real legacy ORM-backed repository

So this is progress in architecture, not yet progress in real data integration.

## Current Stack

- frontend: `Next.js 15.5.14`
- router: App Router
- auth: `Auth.js / next-auth v5 beta`
- ORM: `legacy ORM 7`
- database target: `legacy hosted database Postgres`
- hosting target: `Vercel`
- styling: Tailwind 4 + custom component styling

## What Has Been Built

### 1. Public marketing website

Implemented:

- branded landing page
- responsive layout
- strong visual identity
- contact/social links
- login entry point

Assessment:

- one of the strongest parts of the project
- visually production-leaning
- still missing real lead persistence on the contact/join flow

### 2. Authentication foundation

Implemented:

- Auth.js route handler
- credentials-based login
- legacy ORM adapter
- role-aware JWT/session callbacks
- server-side role layouts
- proxy-based authorization policy
- demo credential fallback in development

Assessment:

- this area is now meaningfully better than before
- this is the most real backend-connected part of the app
- the code is now more maintainable

Still missing:

- signup flow
- password reset flow
- logout surfaced in the main dashboard UI
- richer session/auth helpers for business actions
- admin user management

### 3. Dashboard system

Implemented:

- separate admin/coach/client portals
- dashboard shell
- reusable topbar/sidebar
- many role-specific screens
- cleaner shared state/workspace abstractions

Assessment:

- dashboard breadth is strong
- UI decomposition is good
- code organization is improving
- however, the actual business data behind most screens is still fake

### 4. Database schema

Implemented:

- `User`
- Auth.js tables
- `Coach`
- `Client`
- `Group`
- `Payment`
- `SessionCompensation`
- `File`
- `WorkoutNote`

Assessment:

- schema direction is still correct
- auth/user unification was the right move
- but the schema still does not model the actual gym session domain deeply enough

Still missing:

- real training session model
- bookings/attendance
- normalized subscriptions
- lead/contact submissions
- session notes
- more explicit billing lifecycle

## What Is Real Today

The following areas are genuinely backend-connected:

- user lookup from database during credentials login
- password verification
- Auth.js session generation
- role propagation into session
- role redirects and access enforcement
- legacy ORM connection setup
- seed flow for demo users

## What Is Still Mock Today

This is still the dominant reality of the project.

Most dashboards still import from `lib/mocks/*`.

Confirmed mock-driven areas include:

- admin overview
- admin clients
- admin coaches
- admin profile
- admin schedule
- admin sessions
- admin settings
- admin subscriptions
- client overview
- client coach
- client sessions
- client settings
- client subscription
- coach overview
- coach clients
- coach schedule
- coach sessions
- coach settings

Even where new abstractions exist, many of them still wrap mock data rather than real persistence.

Example:

- `adminClientRepository` exists, but still serves mock client records
- admin client modal is still explicitly frontend-only

## What Improved Architecturally

Compared to the older state, the biggest improvements are:

- auth is more layered
- authorization policy is centralized
- server-side dashboard role layouts exist
- repository/service-style thinking has started
- dashboard UI state patterns are becoming reusable

This matters because the project is no longer just "screens + auth".
It is starting to become a system with actual internal boundaries.

## What Has Not Improved Enough Yet

These are still the main blockers:

### 1. Domain data is still not real

The app still does not have true backend flows for:

- client CRUD
- coach CRUD
- group assignment
- training sessions
- attendance
- bookings
- subscription lifecycle
- payment workflow
- settings persistence
- profile persistence
- lead capture persistence

### 2. Repository pattern is not complete

Right now:

- repository abstraction exists in places
- but it is not yet consistently legacy ORM-backed

This means the backend shape is improving, but not the backend truth.

### 3. No real DAL/services layer across business domains yet

Auth has started to become structured.
The rest of the business logic still needs the same treatment.

### 4. Schema still under-models the real product

The gym/studio core still needs:

- training sessions
- bookings
- attendance
- subscription plans
- client subscriptions
- leads

## Current Maturity Estimate

Updated estimate:

- UI/UX maturity: `78%`
- auth/platform foundation: `58%`
- backend/domain implementation: `25%`
- production readiness overall: `42%`

Why the score improved:

- auth architecture is better
- route security is better
- code organization is better

Why it is still not higher:

- the business engine is still mostly missing
- the dashboards are still largely mock-powered

## Where We Are In The Project

The project is now in this stage:

**past prototype-only architecture, but not yet in real operational backend delivery**

In simple terms:

- before, the app was mostly "nice UI + working auth shell"
- now, it is "nice UI + working auth shell + better backend structure"
- next, it must become "real operational studio software"

So the current stage is:

**backend foundation transition stage**

## What Is Left

The biggest remaining work is not more screen design.

The biggest remaining work is:

### Operational backend

- real CRUD
- real scheduling
- real booking logic
- real billing/subscription logic

### Domain modeling

- add training session domain
- add booking/attendance
- add subscription plan/subscription records
- add leads

### Integration wiring

- replace mock repositories with legacy ORM-backed repositories/DAL
- connect server actions
- revalidate dashboard routes after mutations

### Production hardening

- `AUTH_SECRET`
- lint fix
- build verification
- tests

## Current Blockers

### 1. `AUTH_SECRET` is still missing

`.env` currently contains `LEGACY_DATABASE_CONNECTION` only.

That means auth is still not fully production-safe.

### 2. `npm run lint` still fails

It still fails with the same ESLint circular config serialization error.

### 3. `npm run build` still fails in this environment

The build still stops at `legacy ORM generate` because legacy ORM engine download is blocked in the current environment.

This is partly environment-related, but still important as an operational note.

## Honest Opinion On The Current Codebase

My opinion now is more positive than before.

Why:

- the team is no longer only polishing the UI
- there is visible effort toward real backend architecture
- auth refactoring shows good engineering direction
- route ownership and access rules are cleaner

But the most important truth is still the same:

**the product is not backend-complete yet**

The risk now is not weak code style.
The risk now is false confidence from cleaner architecture while the business flows are still mostly mock.

So my real opinion is:

- the project is improving in the right direction
- the engineering maturity is better than before
- but the team now needs to convert architecture progress into real persisted product behavior

## Recommended Backend For This Project

The recommendation is still the same:

**Use Next.js App Router as the backend-for-frontend, with Auth.js + legacy ORM + legacy hosted database on Vercel.**

This is still the right choice.

Use:

- `Server Components` for protected reads
- `Server Actions` for in-app mutations
- `Route Handlers` for:
  - Auth.js
  - uploads
  - webhooks
  - special integrations

Do not split out a separate backend service right now.

A separate backend is not justified yet.

## Updated Backend Recommendation Based On The New State

Since the project now already has:

- auth service abstractions
- authorization policy
- repository beginnings
- role layouts

the next backend step should be:

**standardize the same pattern across business domains**

That means:

1. finish auth hardening
2. create real DAL/service/action layers for clients and coaches
3. replace mock repositories with legacy ORM-backed repositories
4. add missing training-session schema
5. then convert scheduling and subscription screens

## What I Recommend You Do Next

### Immediate next milestone

Turn admin client and admin coach flows into real DB-backed flows.

Why this is the best next move:

- it builds real operational value fast
- it leverages the new repository/auth structure
- it creates a template for the rest of the app

### Exact next steps

1. fix `AUTH_SECRET`
2. fix ESLint config
3. create legacy ORM-backed client repository/DAL
4. create legacy ORM-backed coach repository/DAL
5. add `zod` validators for create/update client/coach
6. add server actions for create/update client/coach
7. replace mock admin client repository
8. replace mock admin coach repository
9. connect admin overview counts to real aggregate queries

### After that

Build the missing gym domain:

1. `TrainingSession`
2. `SessionBooking`
3. `SubscriptionPlan`
4. `ClientSubscription`
5. `Lead`

## Progress Estimate: How Much Is Left

Roughly speaking:

- completed enough to prove direction: yes
- completed enough for internal demo: mostly yes
- completed enough for operational production use: no

If I translate that into effort:

- done: around `40% to 45%`
- remaining: around `55% to 60%`

Most of the remaining work is backend/domain work, not design work.

## Final Recommendation

Your stack choice is still correct:

- frontend + backend in `Next.js`
- auth with `Auth.js`
- database on `legacy hosted database`
- ORM with `legacy ORM`
- deploy on `Vercel`

The updated truth about the project is:

- the architecture is healthier than before
- auth is better than before
- the dashboards are still mostly mock-driven
- the next win must be real data, not more UI breadth

The project is now at the point where disciplined backend execution will unlock the value of all the UI work that already exists.
