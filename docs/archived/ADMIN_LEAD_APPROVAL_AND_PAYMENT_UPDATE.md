# Admin Lead Approval And Payment Visibility Update

## Goal

Move lead conversion under admin control and make payment visibility obvious in the admin client view.

## What changed

### 1. Admin-controlled lead approval

Added a new admin page:

- `app/(dashboard)/admin/leads/page.tsx`

Added a new workspace:

- `components/dashboard/admin-leads-workspace.tsx`

Added a new repository:

- `lib/repositories/admin-lead-repository.ts`

Added a server action:

- `app/actions/admin-leads.ts`

This flow now lets admin:

- view leads in the dashboard
- search and filter them
- approve a chosen lead as a client
- keep non-approved leads as leads only

### 2. Admin clients page is now database-backed

Replaced the old mock repository with a legacy ORM-backed repository:

- `lib/repositories/admin-client-repository.ts`

The admin clients page now loads real client records from the database.

### 3. Payment status is visible in admin clients

The admin client table and mobile cards now show:

- `Paid`
- `Unpaid`
- `Due soon`

This is derived from subscription payments when available and falls back to the legacy `Client.isPaid` signal when needed.

### 4. Admin navigation updated

Added a `Leads` item to admin navigation so the approval page is reachable.

## Intentional behavior

- `Join Now` still creates a `Lead`.
- A lead does **not** become a `User` or `Client` automatically.
- A lead becomes a client only when admin approves it from the leads page.

## Verification

I verified the update with:

1. `npx tsc --noEmit`
2. `npm run build`

## Follow-up work

1. Add explicit `Mark paid` / `Mark unpaid` admin actions.
2. Add lead detail and notes for sales/admin follow-up.
3. Decide whether payment truth should fully move to `Payment + ClientSubscription` and retire `Client.isPaid`.
