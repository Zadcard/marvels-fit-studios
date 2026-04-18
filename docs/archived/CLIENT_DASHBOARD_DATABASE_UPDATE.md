# Client Dashboard Database Update

## Goal

Replace the client dashboard's mock identity and membership views with data loaded from the database for the signed-in client.

## What is database-backed now

### Overview page

The client overview page now loads real data for:

- assigned coach snapshot
- upcoming sessions
- subscription plan name
- renewal label
- payment status signal
- recent activity based on notes, payments, and bookings
- stats derived from bookings, subscription usage, and coaching notes

### Coach page

The client coach page now loads real data for:

- coach name
- coach email
- coach phone
- assigned group/coaching specialization label
- next booked session
- latest coaching note

### Subscription page

The client subscription page now loads real data for:

- current plan name
- subscription status
- payment status
- renewal date
- billing amount and billing cycle
- benefits derived from the plan and subscription settings

### Sessions page

The client sessions page now loads real data for:

- session title
- date and time
- location
- assigned coach
- group/private type
- upcoming/past period
- derived session status
- latest session note or description

### Settings page

The client settings page now loads real data for:

- full name
- email
- phone
- goal text from the latest workout note when available
- preferred session time inferred from booked sessions

## What is still preview-only

These values still display in the UI but are not yet persisted back to the database when edited:

- client settings form saves
- notification toggles

The page now starts from real database values, but saving is still local preview mode.

## Files added

- `lib/dashboard/client-dashboard-data.ts`
- `lib/repositories/client-dashboard-repository.ts`

## Files updated

- `app/(dashboard)/client/page.tsx`
- `app/(dashboard)/client/coach/page.tsx`
- `app/(dashboard)/client/subscription/page.tsx`
- `app/(dashboard)/client/sessions/page.tsx`
- `app/(dashboard)/client/settings/page.tsx`
- `components/dashboard/client-overview-workspace.tsx`
- `components/dashboard/client-coach-workspace.tsx`
- `components/dashboard/client-subscription-workspace.tsx`
- `components/dashboard/client-sessions-workspace.tsx`
- `components/dashboard/client-settings-workspace.tsx`

## Verification

I verified the change with:

1. `npx tsc --noEmit`
2. `npm run build`

Both passed.

## Follow-up work

1. Persist the client settings form to the database.
2. Add a dedicated client profile/preferences table if those settings need to be stored permanently.
3. Replace any remaining client-facing placeholders that still rely on generic fallback copy rather than stored data.
