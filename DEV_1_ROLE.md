# Developer 1 Role

Last updated: 2026-04-04

## Role Summary

Developer 1 owns the **Admin + Data Core** workstream.

This role is intentionally separated from Developer 2 to reduce merge conflicts.

Developer 1 should mainly work on:

- admin features
- database-facing code
- Prisma-backed repositories for admin flows
- admin server actions
- admin dashboard data integration

Developer 1 should avoid editing Developer 2-owned files unless both developers explicitly agree first.

## Main Goal

Turn the admin side of the app into the real operating core of the product.

That means:

- real admin client management
- real admin coach management
- real admin overview metrics
- real admin schedule/session management
- real admin subscriptions and payments

## Primary Ownership

Developer 1 owns these folders/files first:

### Database and backend core

- [prisma/schema.prisma](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\prisma\schema.prisma)
- [prisma/seed.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\prisma\seed.ts)
- [lib/prisma.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\prisma.ts)
- future `lib/dal/admin-*`
- future `lib/services/admin-*`
- future `app/actions/admin/*`

### Auth-related backend contracts

- [auth.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\auth.ts)
- [auth.config.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\auth.config.ts)
- [proxy.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\proxy.ts)
- [lib/auth/authorization-policy.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\auth\authorization-policy.ts)
- [lib/auth/credentials-auth-service.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\auth\credentials-auth-service.ts)
- [lib/auth/credentials.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\auth\credentials.ts)
- [lib/auth/demo-users.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\auth\demo-users.ts)
- [lib/auth/password-verifier.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\auth\password-verifier.ts)
- [lib/auth/user-repository.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\auth\user-repository.ts)

### Admin repositories and admin dashboard domain files

- [lib/repositories/admin-client-repository.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\repositories\admin-client-repository.ts)
- [lib/dashboard/admin-client-workspace.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\dashboard\admin-client-workspace.ts)
- future admin repositories for coaches, sessions, subscriptions, overview

### Admin routes and admin screens

- [app\(dashboard)\admin\layout.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\layout.tsx)
- [app\(dashboard)\admin\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\page.tsx)
- [app\(dashboard)\admin\clients\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\clients\page.tsx)
- [app\(dashboard)\admin\coaches\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\coaches\page.tsx)
- [app\(dashboard)\admin\profile\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\profile\page.tsx)
- [app\(dashboard)\admin\schedule\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\schedule\page.tsx)
- [app\(dashboard)\admin\sessions\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\sessions\page.tsx)
- [app\(dashboard)\admin\settings\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\settings\page.tsx)
- [app\(dashboard)\admin\subscriptions\page.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\admin\subscriptions\page.tsx)

### Admin components

- [components/dashboard/admin-clients-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-clients-workspace.tsx)
- [components/dashboard/admin-coaches-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-coaches-workspace.tsx)
- [components/dashboard/admin-profile-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-profile-workspace.tsx)
- [components/dashboard/admin-schedule-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-schedule-workspace.tsx)
- [components/dashboard/admin-sessions-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-sessions-workspace.tsx)
- [components/dashboard/admin-settings-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-settings-workspace.tsx)
- [components/dashboard/admin-subscriptions-workspace.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\admin-subscriptions-workspace.tsx)

## Secondary Ownership

Developer 1 may edit these shared files only when necessary:

- [app\(dashboard)\layout.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\app\(dashboard)\layout.tsx)
- [components/dashboard/dashboard-role-shell.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-role-shell.tsx)
- [components/dashboard/dashboard-sidebar.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-sidebar.tsx)
- [components/dashboard/dashboard-topbar.tsx](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\components\dashboard\dashboard-topbar.tsx)
- [lib/navigation/dashboard-nav.ts](C:\Users\DELL\Desktop\marvels-fit-studios\marvels-fit-studios\lib\navigation\dashboard-nav.ts)

Rule:

- if Developer 1 must touch shared files, it should be in a small dedicated PR
- Developer 2 should be informed before that PR is merged

## Files Developer 1 Should Avoid

To prevent conflicts, Developer 1 should normally not edit:

- `app/(dashboard)/client/**`
- `app/(dashboard)/coach/**`
- `components/dashboard/client-*`
- `components/dashboard/coach-*`
- `app/page.tsx`
- `components/landing/*`

## Milestone Ownership

### Milestone 1: Platform stabilization

Developer 1 owns:

- `AUTH_SECRET` setup
- auth cleanup
- Prisma stability
- lint/build blockers that affect admin/data work

### Milestone 2: Real admin clients

Developer 1 owns:

- replace mock admin client repository with Prisma-backed implementation
- add client validators
- add admin client actions
- connect admin client queries to DB

### Milestone 3: Real admin coaches

Developer 1 owns:

- create coach repository/service/action pattern
- connect coach data to DB

### Milestone 4: Admin overview + groups

Developer 1 owns:

- overview aggregate queries
- group schema/rules
- admin group assignment logic

### Milestone 5: Sessions domain

Developer 1 owns:

- `TrainingSession` schema
- `SessionBooking` schema
- attendance logic
- admin schedule/session backend

### Milestone 6: Subscriptions + payments

Developer 1 owns:

- subscription plan schema
- subscription records
- payment rules
- compensation-related backend

### Milestone 7: Production hardening

Developer 1 owns:

- migration safety
- auth correctness
- data integrity
- backend test coverage

## Definition of Done for Developer 1

Developer 1 is done only when:

- admin flows use real DB data
- training/session domain is real
- billing/subscription domain is real
- auth is production-safe
- database changes are stable on Neon/Vercel

## Working Rules

Developer 1 should:

- create backend contracts before UI wiring when possible
- keep schema changes isolated
- avoid mixing admin and client/coach portal UI work in the same PR
- keep PRs scoped by one domain at a time

## Final Mission

Developer 1 takes the project from:

- auth shell + admin mocks

to:

- real admin operating backend
- real session engine
- real subscription/payment engine

This role owns the data truth of the product until the absolute end of the project.
