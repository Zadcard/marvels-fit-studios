# Developer 1 Tasks

Last updated: 2026-04-04

This file is the practical task list for Developer 1.

Developer 1 works on the **Admin + Data Core** side of the project.

Important rule:

- Developer 1 should stay away from Developer 2 files unless both developers finish and agree to merge shared changes later.

## Main Working Area

Developer 1 should work only in these areas first:

- `prisma/*`
- `lib/prisma.ts`
- `lib/auth/*`
- `lib/repositories/admin-*`
- future `lib/dal/*`
- future `lib/services/*`
- future `lib/validators/*`
- future `app/actions/admin/*`
- `app/(dashboard)/admin/*`
- `components/dashboard/admin-*`

## Do Not Touch

Developer 1 should not work in these areas during parallel execution:

- `app/page.tsx`
- `components/landing/*`
- `app/login/*`
- `app/(dashboard)/client/*`
- `app/(dashboard)/coach/*`
- `components/dashboard/client-*`
- `components/dashboard/coach-*`

Avoid shared files too unless absolutely necessary:

- `components/dashboard/dashboard-role-shell.tsx`
- `components/dashboard/dashboard-sidebar.tsx`
- `components/dashboard/dashboard-topbar.tsx`
- `lib/navigation/dashboard-nav.ts`

## Phase 1 Tasks: Local Stabilization

- Fix backend/platform issues blocking real development.
- Add `AUTH_SECRET` locally.
- Review `.env` setup for local development.
- Make sure auth backend code is stable.
- Fix Prisma-related local setup problems.
- Help isolate lint/build blockers that affect backend work.

## Phase 2 Tasks: Admin Client Backend

- Replace the mock implementation in `lib/repositories/admin-client-repository.ts`.
- Create a real Prisma-backed admin client repository.
- Create client validators.
- Create admin client create/update backend logic.
- Create admin client server actions.
- Connect admin client data reads to the database.
- Prepare admin client aggregate data if needed.

## Phase 3 Tasks: Admin Coach Backend

- Create a real admin coach repository.
- Create coach validators.
- Create admin coach create/update backend logic.
- Create admin coach server actions.
- Connect admin coach data reads to the database.

## Phase 4 Tasks: Admin Groups and Overview Backend

- Add backend support for groups.
- Add group-related schema changes if needed.
- Create group repository/service/action logic.
- Add real admin overview aggregate queries.
- Replace admin overview mock metrics with database-backed metrics.

## Phase 5 Tasks: Session Domain Backend

- Add `TrainingSession` model to Prisma schema.
- Add `SessionBooking` model to Prisma schema.
- Add `SessionNote` model if needed.
- Create migrations for the new session-related models.
- Create session validators.
- Create session services.
- Create booking/attendance services.
- Create admin session/schedule server actions.
- Create DAL/repository logic for session reads.

## Phase 6 Tasks: Subscription and Payment Backend

- Add `SubscriptionPlan` model.
- Add `ClientSubscription` model.
- Adapt `Payment` model if needed.
- Create migrations for subscription/payment changes.
- Create subscription validators.
- Create payment validators.
- Create subscription services.
- Create payment services.
- Create admin subscription/payment server actions.

## Phase 7 Tasks: Supporting Backend

- Add `Lead` model for contact/join form submissions.
- Add backend logic for workout notes persistence.
- Add backend logic for file metadata persistence.
- Add settings/profile persistence for admin-facing flows if needed.

## Phase 8 Tasks: Backend Hardening

- Review auth correctness.
- Review authorization correctness.
- Review Prisma query quality.
- Review migration safety.
- Add backend tests for critical business logic.
- Make sure local backend behavior is consistent before deployment.

## End Goal for Developer 1

Developer 1 is finished when:

- admin pages use real backend data
- admin mutations are real
- sessions are real
- subscriptions/payments are real
- contact/notes/files backend flows exist
- the database schema is ready for final deployment later

## Parallel Safety Rule

If Developer 1 follows this file correctly, most of the work will stay separate from Developer 2 because Developer 1 is focused on:

- database
- auth backend
- admin backend
- domain logic

That keeps Developer 1 away from:

- landing page
- login UX
- coach portal UI
- client portal UI
