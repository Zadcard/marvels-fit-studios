# Coach Client Visibility Backend Update

## Goal

Make real clients appear in the coach dashboard for the coaches they are assigned to.

## Assignment rule implemented

A client is now visible to a coach when either of these is true:

1. the client belongs to a `Group` owned by that coach
2. the client has a `SessionBooking` for a `TrainingSession` owned by that coach

This gives us a practical multi-assignment rule without needing another join table yet.

## Backend changes made

### 1. Added a shared coach-client record shape

Created:

- `lib/dashboard/coach-client-record.ts`

This file holds:

- `CoachClientRecord`
- coach-facing status and plan types
- filter option lists used by the coach clients UI

### 2. Added a legacy ORM-backed repository

Created:

- `lib/repositories/coach-client-repository.ts`

This repository:

- finds clients for a coach by `session.user.id`
- includes both group assignment and booked-session assignment
- returns serializable dashboard records
- derives coach-facing fields such as:
  - `planType`
  - `status`
  - `nextSession`
  - `lastTouchpoint`
  - `currentFocus`
  - `progressNote`

### 3. Connected the page to the signed-in coach

Updated:

- `app/(dashboard)/coach/clients/page.tsx`

The page now:

- reads the authenticated user with `auth()`
- redirects to `/login` if no session user id exists
- queries the repository using the logged-in coach's user id
- passes real records into the workspace component

### 4. Updated the coach clients workspace to accept real records

Updated:

- `components/dashboard/coach-clients-workspace.tsx`

The workspace now receives `records` as props instead of importing mock client rows.

### 5. Expanded the demo seed to reflect assignment

Updated:

- `legacy ORM/seed.ts`

The seed now also creates:

- a coach-owned group
- a client assigned to that group
- a training session linked to that group and coach
- a session booking for the client
- a workout note for richer coach-facing status/focus output
- a session note for the seeded session

## Verification performed

I ran:

1. `npx tsc --noEmit`
2. `npm run build`

Both passed.

## Notes on current behavior

- The visibility rule supports a client appearing for more than one coach if the client books sessions across different coaches.
- The current data model still has transitional membership fields on `Client`, but coach visibility no longer depends on mock records.
- The coach overview page is still mock-backed. This change specifically moves the coach clients page to real backend data.

## Natural follow-up work

1. Move the coach overview roster snapshot to the same repository.
2. Add admin tooling to explicitly assign clients to groups and coaches.
3. Add coach-created progress note actions instead of relying on seed/demo notes.
4. Replace more coach pages that still use mock session data.
