# Marvel's Fit Studios Backend Implementation Plan

Last updated: 2026-04-04

This document is the execution guide for building the real backend of the project.

It is written for:

- `Next.js App Router`
- `Vercel`
- `Neon Postgres`
- `Prisma`
- `Auth.js`
- a team of `2 developers` working in parallel

## 1. Backend Strategy

Use the existing `Next.js` app as the backend-for-frontend.

Do not create a separate backend service right now.

Use:

- `Server Components` for secure reads
- `Server Actions` for dashboard form mutations
- `Route Handlers` only for:
  - Auth.js
  - uploads/integrations
  - webhooks
  - public/external API needs

Why:

- simplest deploy path on Vercel
- least operational overhead
- fits the current dashboard-heavy app very well
- keeps auth, UI, and domain logic in one codebase

## 1.1 Current Backend Baseline

Compared to the earlier project state, the codebase already has some useful backend foundation pieces:

- `lib/auth/credentials-auth-service.ts`
- `lib/auth/user-repository.ts`
- `lib/auth/password-verifier.ts`
- `lib/auth/authorization-policy.ts`
- role-specific server layouts for admin/coach/client dashboards
- a reusable Prisma getter in `lib/prisma.ts`
- early dashboard abstraction in `lib/dashboard/*`
- early repository abstraction in `lib/repositories/*`

Important note:

- this is meaningful architectural progress
- but most business repositories still return mock data
- so the next backend work should build on these abstractions rather than replacing them

## 2. Final Backend Goals

By the end of backend implementation, the app should support:

- authentication and role-based access
- admin CRUD for clients
- admin CRUD for coaches
- group assignment and management
- real training session scheduling
- client bookings and attendance
- session compensation flow
- payment tracking
- subscription tracking
- coach portal with real assigned data
- client portal with real membership/session data
- contact lead capture
- file metadata persistence
- workout notes persistence

## 3. Core Backend Principles

Follow these rules from the start:

1. UI components must not talk to Prisma directly.
2. All reads go through server-only data access modules.
3. All mutations must validate input with `zod`.
4. All mutations must check auth and authorization.
5. Business rules live in services, not in pages.
6. Prisma models should represent real business concepts, not frontend convenience.
7. Mock data must be replaced gradually, page by page, not all at once.

## 4. Recommended Folder Structure

Create and use this structure:

```txt
app/
  actions/
    admin/
      clients.ts
      coaches.ts
      groups.ts
      sessions.ts
      subscriptions.ts
    client/
      bookings.ts
      profile.ts
    coach/
      notes.ts
      attendance.ts
  api/
    auth/
    uploads/
    webhooks/

lib/
  auth/
    session.ts
    guards.ts
    roles.ts
  db/
    prisma.ts
  dal/
    users.ts
    clients.ts
    coaches.ts
    groups.ts
    training-sessions.ts
    bookings.ts
    subscriptions.ts
    payments.ts
    leads.ts
    files.ts
    workout-notes.ts
  services/
    client-service.ts
    coach-service.ts
    group-service.ts
    training-session-service.ts
    booking-service.ts
    subscription-service.ts
    payment-service.ts
    compensation-service.ts
    lead-service.ts
  validators/
    auth.ts
    client.ts
    coach.ts
    group.ts
    training-session.ts
    booking.ts
    payment.ts
    subscription.ts
    lead.ts
  dto/
    admin.ts
    coach.ts
    client.ts
```

Notes:

- keep `lib/prisma.ts` or move it to `lib/db/prisma.ts`
- never import Prisma from client components
- use `server-only` in DAL files

## 5. Environment Variables

These env vars should exist locally and in Vercel:

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=true
```

Later, if uploads or notifications are added:

```bash
UPLOADTHING_TOKEN=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```

Rules:

- do not hardcode secrets
- use Vercel envs for Production, Preview, and Development
- generate `AUTH_SECRET` before production

## 6. Backend Phases

Implement in these phases.

Do not jump to later phases before the foundation is stable.

### Phase 0: Stabilize the platform

Goal:

- make the project safe to build on

Tasks:

1. fix ESLint config so `npm run lint` works
2. ensure `AUTH_SECRET` is configured
3. verify `prisma generate` and `prisma migrate deploy`
4. clean up auth env handling
5. document local setup for both devs

Definition of done:

- both devs can run local app
- lint works
- schema generates
- migrations apply cleanly

### Phase 1: Create backend foundation

Goal:

- establish the architecture for all future work

Tasks:

1. create `lib/auth/session.ts`
2. create `lib/auth/guards.ts`
3. create `lib/dal/*`
4. create `lib/services/*`
5. create `lib/validators/*`
6. create first reusable DTO helpers
7. define mutation pattern for server actions

Definition of done:

- reads use DAL
- mutations use validators + guards + services
- no direct Prisma usage in pages

Updated note for current state:

- auth foundation is partially done already
- dashboard abstraction has started already
- repository thinking has started already
- Phase 1 should now focus on extending this pattern to real business domains, not starting from zero

### Phase 2: Real admin data

Goal:

- replace the most important mock admin screens first

Tasks:

1. replace admin clients page with real reads/writes
2. replace admin coaches page with real reads/writes
3. implement groups management
4. connect admin overview stats to aggregate queries

Definition of done:

- admin can create, edit, list clients
- admin can create, edit, list coaches
- admin can assign clients to groups and groups to coaches

### Phase 3: Training session domain

Goal:

- build the real operational core of the studio

Tasks:

1. add training session tables
2. add bookings/attendance tables
3. implement admin schedule and sessions logic
4. implement coach schedule and assigned sessions logic
5. implement client session booking view

Definition of done:

- sessions are persisted
- coach sees real assigned sessions
- client sees real upcoming sessions
- attendance and capacity are tracked

### Phase 4: Subscriptions and payments

Goal:

- replace billing-related mock UI with real data

Tasks:

1. normalize subscription plans
2. add active subscription records
3. connect payment history
4. compute status from database, not frontend labels
5. support compensation impact on sessions

Definition of done:

- subscription page uses real payment and plan data
- admin can track paid/due/overdue states

### Phase 5: Notes, files, and lead capture

Goal:

- finish the operational support flows

Tasks:

1. connect contact form to lead persistence
2. add file metadata persistence
3. add workout notes CRUD
4. add admin/coaches ability to see related files/notes

Definition of done:

- the app supports operational work beyond just membership and scheduling

## 7. New Prisma Models You Should Add

Current schema is missing the actual gym session domain.

You should add these models.

### 7.1 TrainingSession

Purpose:

- represents a real gym/training session

Suggested fields:

```prisma
model TrainingSession {
  id            String   @id @default(cuid())
  title         String
  description   String?
  type          TrainingSessionType
  status        TrainingSessionStatus @default(SCHEDULED)
  startsAt      DateTime
  endsAt        DateTime
  capacity      Int?
  location      String?
  coachId       String
  groupId       String?
  createdById   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  coach         Coach    @relation(fields: [coachId], references: [id])
  group         Group?   @relation(fields: [groupId], references: [id])
  createdBy     User     @relation("TrainingSessionCreatedBy", fields: [createdById], references: [id])
  bookings      SessionBooking[]
  notes         SessionNote[]
}
```

Enums:

```prisma
enum TrainingSessionType {
  GROUP
  PRIVATE
}

enum TrainingSessionStatus {
  DRAFT
  SCHEDULED
  COMPLETED
  CANCELED
}
```

### 7.2 SessionBooking

Purpose:

- represents a client booking or attendance record

Suggested fields:

```prisma
model SessionBooking {
  id                String   @id @default(cuid())
  trainingSessionId String
  clientId          String
  status            BookingStatus @default(BOOKED)
  bookedAt          DateTime @default(now())
  attendedAt        DateTime?
  canceledAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  trainingSession   TrainingSession @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  client            Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([trainingSessionId, clientId])
}
```

Enum:

```prisma
enum BookingStatus {
  BOOKED
  ATTENDED
  MISSED
  CANCELED
  WAITLIST
}
```

### 7.3 SubscriptionPlan

Purpose:

- defines available plans instead of storing plan meaning only in UI labels

Suggested fields:

```prisma
model SubscriptionPlan {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  description      String?
  billingCycle     BillingCycle
  sessionsIncluded Int?
  price            Float
  currency         String   @default("EGP")
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  subscriptions    ClientSubscription[]
}
```

### 7.4 ClientSubscription

Purpose:

- tracks actual client subscription lifecycle

Suggested fields:

```prisma
model ClientSubscription {
  id            String   @id @default(cuid())
  clientId      String
  planId        String
  status        SubscriptionStatus @default(ACTIVE)
  startsAt      DateTime
  endsAt        DateTime?
  renewsAt      DateTime?
  sessionsTotal Int?
  sessionsUsed  Int      @default(0)
  isAutoRenew   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  client        Client             @relation(fields: [clientId], references: [id], onDelete: Cascade)
  plan          SubscriptionPlan   @relation(fields: [planId], references: [id])
  payments      Payment[]
}
```

Enums:

```prisma
enum SubscriptionStatus {
  ACTIVE
  TRIAL
  PAUSED
  EXPIRED
  CANCELED
}

enum BillingCycle {
  MONTHLY
  WEEKLY
  CUSTOM
}
```

### 7.5 Lead

Purpose:

- stores contact/join form submissions from the landing page

Suggested fields:

```prisma
model Lead {
  id          String   @id @default(cuid())
  fullName    String
  phone       String
  message     String?
  source      String   @default("website")
  status      LeadStatus @default(NEW)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CLOSED
}
```

### 7.6 SessionNote

Purpose:

- attach notes directly to a training session when needed

Suggested fields:

```prisma
model SessionNote {
  id                String   @id @default(cuid())
  trainingSessionId String
  authorId          String
  content           String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  trainingSession   TrainingSession @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  author            User            @relation(fields: [authorId], references: [id])
}
```

## 8. What to Keep From the Existing Schema

Keep:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Coach`
- `Client`
- `Group`
- `Payment`
- `SessionCompensation`
- `File`
- `WorkoutNote`

But evolve them:

- `Payment` should eventually relate to subscriptions or invoices more clearly
- `Client.membershipType`, `sessionsLeft`, and `isPaid` may become derived or transitional fields
- avoid duplicating subscription truth in too many places

## 9. Authentication and Authorization Design

### 9.1 Authentication

Keep `Auth.js Credentials` for now.

Required improvements:

1. add `AUTH_SECRET`
2. remove production dependence on demo fallback
3. add logout button in dashboard
4. add helper to get current session safely on server

Create:

`lib/auth/session.ts`

Suggested responsibilities:

- `requireSession()`
- `requireUser()`
- `requireRole(role)`
- `requireAnyRole([...roles])`
- `getCurrentUserSummary()`

### 9.2 Authorization

Authorization must not live only in `proxy.ts`.

Use `proxy.ts` only for route-level protection.

Real authorization must also happen in:

- server actions
- route handlers
- DAL/service layer where necessary

Examples:

- only admin can create coaches
- only admin can create groups
- only coach assigned to a session can mark attendance
- only client can book for self unless admin override exists

## 10. Data Access Layer Design

Each DAL module should:

- be `server-only`
- return safe DTOs
- avoid returning raw full Prisma objects to UI unnecessarily
- centralize query shape

Example DAL responsibilities:

### `lib/dal/clients.ts`

- `getAdminClientsList(filters)`
- `getClientByIdForAdmin(clientId)`
- `getClientPortalOverview(userId)`
- `getCoachClients(coachUserId)`

### `lib/dal/coaches.ts`

- `getAdminCoachesList(filters)`
- `getCoachByIdForAdmin(coachId)`
- `getCoachPortalOverview(userId)`

### `lib/dal/training-sessions.ts`

- `getAdminSchedule(range, filters)`
- `getCoachSchedule(userId, range)`
- `getClientUpcomingSessions(userId)`
- `getSessionById(sessionId)`

### `lib/dal/subscriptions.ts`

- `getAdminSubscriptions(filters)`
- `getClientSubscription(userId)`
- `getSubscriptionFinancialSummary()`

## 11. Service Layer Design

Service layer handles business rules.

Do not put these rules directly in actions.

Examples:

### `client-service.ts`

- create client user + client profile
- update client
- assign client to group
- enforce unique email

### `coach-service.ts`

- create coach user + coach profile
- update coach
- validate specialization/availability rules if added later

### `training-session-service.ts`

- create session
- update session
- cancel session
- ensure coach exists
- ensure capacity rules
- ensure time validity

### `booking-service.ts`

- book client into session
- prevent duplicate booking
- prevent over-capacity
- mark attendance
- handle waitlist

### `subscription-service.ts`

- create subscription
- renew subscription
- expire subscription
- compute `sessionsLeft`

### `payment-service.ts`

- record payment
- attach payment to subscription
- update derived subscription status

## 12. Validation Layer

Every mutation must use `zod`.

Create one file per domain.

Examples:

### `validators/client.ts`

- `createClientSchema`
- `updateClientSchema`
- `assignClientGroupSchema`

### `validators/training-session.ts`

- `createTrainingSessionSchema`
- `updateTrainingSessionSchema`
- `cancelTrainingSessionSchema`

### `validators/payment.ts`

- `recordPaymentSchema`

Rules:

- validate shape
- validate enums
- validate date ranges
- validate positive numbers
- normalize strings with `.trim()`

## 13. Server Action Pattern

Every server action should follow this order:

1. `use server`
2. get current user/session
3. authorize role
4. parse input with zod
5. call service
6. revalidate relevant routes
7. return success/error state

Example pattern:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClientSchema } from "@/lib/validators/client";
import { createClient } from "@/lib/services/client-service";

export async function createClientAction(input: unknown) {
  await requireRole("ADMIN");

  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten(),
    };
  }

  await createClient(parsed.data);
  revalidatePath("/admin/clients");

  return { ok: true };
}
```

## 14. Route Handler Pattern

Use route handlers only when the flow is not a normal in-app mutation.

Examples:

- upload callback
- webhook receiver
- external system endpoint

Pattern:

1. authenticate if private
2. validate request body
3. call service
4. return typed JSON response

## 15. Migration Strategy

Because 2 devs are working, migrations must be controlled carefully.

Rules:

1. one developer owns schema changes at a time inside a milestone
2. do not create overlapping schema branches in parallel
3. agree on schema changes before implementation starts
4. merge schema PR first if other work depends on it
5. regenerate Prisma client after schema changes

Recommended workflow:

1. Dev A edits `prisma/schema.prisma`
2. Dev A creates migration
3. Dev A merges schema PR
4. Dev B rebases and continues feature work on top

## 16. Testing Strategy

Minimum tests to add while building backend:

### Unit/integration level

- validator tests
- service rule tests
- auth guard tests
- booking capacity rules
- duplicate email prevention

### Flow level

- admin creates client
- admin creates coach
- admin creates session
- client books session
- coach marks attendance
- admin records payment

### Manual smoke checklist

- login by each role
- access control between portals
- create/edit records
- dashboard reads update after mutation

## 17. Vercel + Neon Operational Notes

### Prisma on Vercel

Use:

- `prisma generate` in build
- `prisma migrate deploy` in deployment flow

### Neon

Use Neon as the main Postgres database.

Recommendations:

- keep one branch/db for production
- use preview/dev branches as needed
- avoid destructive migrations without backup thinking

### Runtime notes

- route handlers and server actions that use Prisma should assume Node runtime
- avoid accidental edge-only patterns in Prisma-powered code

## 18. Two-Developer Collaboration Plan

This is the most important section for team execution.

We want both devs to move fast without merge pain.

## 18.1 Roles

Recommended split:

- `Dev A`: backend platform and data ownership
- `Dev B`: feature wiring and UI integration ownership

This does not mean one dev only writes backend and the other only frontend.
It means ownership is clear.

### Dev A owns

- Prisma schema changes
- migrations
- DAL modules
- service layer
- validators
- auth/session helpers
- shared DTOs

### Dev B owns

- replacing mocks in pages/components
- wiring forms to server actions
- handling loading/error/success states
- updating dashboard screens to consume real DTOs
- keeping UI behavior polished while backend lands

## 18.2 Safe Parallel Work Pattern

Use this pattern in every milestone:

1. Dev A lands foundational backend contracts first
2. Dev B builds UI against those contracts
3. Both agree on input/output types before implementation
4. Dev B never directly invents Prisma queries inside pages
5. Dev A avoids editing feature UI unless needed for integration

## 18.3 Ownership by Milestone

### Milestone 1: Platform setup

Dev A:

- fix lint
- fix env handling
- stabilize Prisma and auth helpers

Dev B:

- add logout UX
- prepare common form state patterns
- clean dashboard UI pieces for real data loading states

### Milestone 2: Clients + coaches

Dev A:

- validators for client/coach
- client/coach services
- client/coach DAL
- related server actions

Dev B:

- wire admin clients screen to real actions
- wire admin coaches screen to real actions
- replace mock lists/details/forms

### Milestone 3: Groups + overview

Dev A:

- group services/DAL/actions
- aggregate queries for admin overview

Dev B:

- connect admin overview cards
- connect group assignment UX

### Milestone 4: Sessions domain

Dev A:

- add training session schema
- add booking schema
- add session services/DAL/actions

Dev B:

- wire admin sessions page
- wire admin schedule page
- wire coach sessions/schedule page
- wire client sessions page

### Milestone 5: Subscriptions + payments

Dev A:

- subscription plan schema
- subscription/payment services
- subscription/payment DAL

Dev B:

- wire admin subscriptions screen
- wire client subscription screen

### Milestone 6: Notes, files, leads

Dev A:

- lead/file/note backend

Dev B:

- connect landing contact form
- connect coach/client/admin note/file UI

## 18.4 Branching Strategy

Recommended branch naming:

- `codex/backend-foundation`
- `codex/admin-clients-real-data`
- `codex/admin-coaches-real-data`
- `codex/session-domain`
- `codex/subscriptions-payments`

Rules:

- one branch per focused milestone or feature
- schema branch merges first if it blocks others
- avoid both devs editing `prisma/schema.prisma` at the same time

## 18.5 PR Rules for 2 Devs

Every PR should state:

- what models changed
- what actions changed
- what routes/pages are affected
- whether migrations are included
- manual test checklist

Every schema-affecting PR should include:

- migration file
- seed impact note
- any required env changes

## 19. Detailed Step-by-Step Execution Plan

This is the exact order I recommend.

### Step 1

Fix the platform.

- fix ESLint config
- add `AUTH_SECRET`
- confirm local login still works
- confirm Prisma generate/migrate work in a proper networked dev environment

### Step 2

Create backend folders.

- add `lib/auth`
- add `lib/dal`
- add `lib/services`
- add `lib/validators`
- add `app/actions`

Current-state adjustment:

- `lib/auth` already exists
- part of the reusable dashboard infrastructure already exists
- priority now is to add the missing `dal`, `services`, `validators`, and `actions` layers around the existing structure

### Step 3

Implement auth helpers.

- `requireSession`
- `requireUser`
- `requireRole`
- `requireAnyRole`

### Step 4

Implement validators for:

- client
- coach
- group

### Step 5

Implement services for:

- create client
- update client
- create coach
- update coach
- create group
- assign client to group

Current-state adjustment:

- keep the existing auth service style as the reference for code shape
- do not bypass the new abstractions by writing Prisma calls directly inside dashboard components

### Step 6

Implement DAL for:

- admin clients list
- admin coaches list
- groups list
- admin overview aggregates

### Step 7

Implement server actions for:

- create client
- update client
- create coach
- update coach
- create group
- assign client to group

### Step 8

Replace admin mock screens:

- `admin-clients`
- `admin-coaches`
- then admin overview

Current-state adjustment:

- `admin-clients` already has a repository abstraction, but it is mock-backed
- start by replacing the repository implementation with Prisma-backed data access
- then move the same pattern to coaches and overview aggregates

### Step 9

Add session domain schema and migration.

- `TrainingSession`
- `SessionBooking`
- maybe `SessionNote`

### Step 10

Implement session services:

- create session
- update session
- cancel session
- list schedule
- list coach sessions
- list client sessions

### Step 11

Wire:

- admin sessions page
- admin schedule page
- coach schedule page
- coach sessions page
- client sessions page

### Step 12

Add subscription domain schema.

- `SubscriptionPlan`
- `ClientSubscription`
- adapt `Payment`

### Step 13

Implement payments/subscriptions services and pages.

### Step 14

Add:

- leads
- notes
- file metadata

### Step 15

Remove old mock dependencies page by page until `lib/mocks` is only leftover for demo/dev seeds or is deleted fully.

## 20. Priority Order of Real Screens

Convert these first:

1. `/admin/clients`
2. `/admin/coaches`
3. `/admin`
4. `/admin/sessions`
5. `/admin/schedule`
6. `/client/sessions`
7. `/coach/sessions`
8. `/coach/schedule`
9. `/admin/subscriptions`
10. `/client/subscription`

Reason:

- this order creates a real admin operating core before polishing secondary flows

## 21. Risks to Avoid

Do not do these:

- do not keep building more screens on top of mocks
- do not put Prisma queries in client components
- do not rely on `proxy.ts` alone for authorization
- do not let both devs modify schema simultaneously
- do not keep subscription truth split between UI labels and DB booleans forever
- do not create a separate backend prematurely

## 22. Definition of Backend Completion

You can say the backend is substantially complete when:

- all major dashboard pages read from real DB data
- all major forms mutate through server actions/services
- role checks exist for all sensitive actions
- session scheduling is real
- booking and attendance are real
- subscriptions and payments are real
- no critical admin screens depend on `lib/mocks`
- deploys work reliably on Vercel with Neon

## 23. Recommended First Sprint

If starting immediately, Sprint 1 should be:

### Dev A

- fix ESLint
- add auth helpers
- add DAL/services/validators for client + coach
- implement client/coach server actions

### Dev B

- wire admin clients page to real actions
- wire admin coaches page to real actions
- add reusable loading/error/success states
- add logout entry in dashboard

### Sprint 1 Done Means

- admin clients and coaches are no longer mock
- auth is more production-safe
- the backend architecture exists and is reusable

## 24. Final Recommendation

The best implementation path is:

- keep the current stack
- build a clean internal backend inside the Next.js app
- move in vertical slices
- let Dev A own data contracts and Dev B own integration/UI wiring

If you follow this document, the team can build the real backend without losing the current UI momentum and without creating unnecessary architecture complexity.
