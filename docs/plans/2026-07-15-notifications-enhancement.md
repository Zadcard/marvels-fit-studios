# Notifications Enhancement Plan

**Date:** 2026-07-15
**Status:** Draft
**Scope:** The in-app notifications page (admin/coach/client) and the automation that feeds it.
**Related:** [2026-07-15-join-request-flow-revamp.md](./2026-07-15-join-request-flow-revamp.md) — step 8 of that plan (admin notification on new join request) is implemented here as idea N6.

---

## 1. Current state (as-is)

- **Pages:** `app/(dashboard)/{admin,coach,client}/notifications/page.tsx`, all
  rendering `components/dashboard/notification-workspace.tsx` — a flat list of
  up to 50 rows with a per-row "Mark read" button and an optional "Open" link.
- **Data:** `lib/repositories/notification-repository.ts` (`listNotifications`,
  last 50 by `createdAt`).
- **Actions:** `app/actions/notifications.ts` — only `markNotificationRead`.
- **Generation:** hourly Vercel cron (`vercel.json`) →
  `app/api/cron/studio-automation/route.ts` →
  `lib/automation/studio-automation.ts` → Postgres RPC
  `enqueue_studio_notifications`
  (`supabase/migrations/20260714002100_notification_automation.sql`).
- **Only two events exist:**
  1. `SESSION_REMINDER` — booked/waitlisted client, ~24h before a scheduled session.
  2. `RENEWAL_REMINDER` — active/trial subscription, ~7 days before renewal.
- **Schema already supports more:** `kind` enum (with an unused `SYSTEM`
  value), `href`, `metadata` jsonb, and a unique `dedupeKey` that makes
  inserts idempotent. `AutomationRun` records job health but nothing reads it.

### Why the page feels empty

1. Only two event sources ever write to it.
2. Nothing outside the page signals unread items — the topbar link
   (`components/dashboard/dashboard-topbar.tsx`) has no count, and the
   sidebar's existing `badge` slot is unused for this.
3. The list itself is a wall of identical rows: no grouping, no filtering, no
   per-kind visuals, no bulk actions.

---

## 2. Ideas (ordered by value-for-effort)

### Tier A — quick wins, no schema changes

| # | Idea | Notes |
|---|------|-------|
| N1 | **Unread badge in topbar/sidebar** | Highest value. Query unread count in the dashboard layout (index `Notification_recipient_status_created_idx` makes it cheap) and render on the topbar notifications link; sidebar `badge` slot already exists. |
| N2 | **"Mark all as read"** | One-at-a-time mark-read doesn't scale past a few rows. Single `update … where recipientId = ? and status != 'READ'`. |
| N3 | **Mark read on open** | Clicking the "Open" (`href`) link should mark the notification read; today it stays unread unless both buttons are clicked. |
| N4 | **Grouping + filters** | Group by day (Today / Yesterday / Earlier); filter tabs All / Unread / per-`kind` using the existing enum. |
| N5 | **Kind icons + tones** | Calendar icon for `SESSION_REMINDER`, card icon for `RENEWAL_REMINDER`, reuse `DashboardStatusBadge` tones. |

### Tier B — more event sources (the real fix)

The `enqueue_studio_notifications` + `dedupeKey` pattern generalizes: each new
event is either another `insert … on conflict ("dedupeKey") do nothing` block
in the RPC, or a direct insert from the relevant server action.

| # | Idea | Recipient | Trigger |
|---|------|-----------|---------|
| N6 | **New join request submitted** (+ "requests waiting > 48h") | Admin | Insert from `submitJoinNowLead`; aging check in the cron RPC. Implements step 8 of the join-request revamp. |
| N7 | **Booking events on own sessions** (booked / cancelled / waitlist promoted) + 1h pre-session nudge | Coach | Inserts from booking actions; nudge in cron RPC. |
| N8 | **Booking confirmed/cancelled, payment recorded, subscription expired** | Client | Inserts from the relevant admin/coach actions; "expired" check in cron RPC (complements the existing 7-day pre-renewal reminder). |
| N9 | **Automation health alerts** | Admin | `SYSTEM` notification when an `AutomationRun` fails — the table already records failures; nothing surfaces them. |

### Tier C — bigger, later

| # | Idea | Notes |
|---|------|-------|
| N10 | **Per-kind notification preferences** | Needs a small preferences table. Only worth it once there are enough kinds to annoy people. |
| N11 | **Delivery beyond in-app** (WhatsApp deep-link / email digest) | Same "no provider wired up" gap as the join-request plan — pick a provider once and use it for both flows. |
| N12 | **Realtime badge updates** (Supabase Realtime) | Nice-to-have; a periodic refresh gets ~90% of the value for free. |

---

## 3. Recommended first pass

**N1 + N2 + N3 + N6** — badge, mark-all, mark-on-open, and join-request
events. This makes the page immediately functional and connects it to the
join-request approval flow.

---

## 4. Key files

| Area | File |
|------|------|
| Workspace UI | `components/dashboard/notification-workspace.tsx` |
| Pages | `app/(dashboard)/{admin,coach,client}/notifications/page.tsx` |
| Actions | `app/actions/notifications.ts` |
| Repository | `lib/repositories/notification-repository.ts` |
| Automation runner | `lib/automation/studio-automation.ts` |
| Cron route | `app/api/cron/studio-automation/route.ts` |
| Cron schedule | `vercel.json` |
| Schema + RPC | `supabase/migrations/20260714002100_notification_automation.sql` |
| Topbar (badge target) | `components/dashboard/dashboard-topbar.tsx` |
| Sidebar (badge slot) | `components/dashboard/dashboard-sidebar.tsx` |
