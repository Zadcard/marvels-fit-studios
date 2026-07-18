# Where To Edit (Project Navigation Guide)

This file exists to solve one problem: when you want to change something, you can quickly find the right file without guessing.

> **Verified 2026-07-18** against the live file tree after the Marvel Ops redesign. The previous version of this table predated the redesign and pointed at several deleted routes and orphaned components (see `docs/system-audit-2026-07-18.md` §9.8). This codebase changes fast — re-check imports before trusting a row here if it's been more than a few days.

## 60-Second Mental Model

Most dashboard features follow this pattern:

1. Route page (entry): `app/(dashboard)/<role>/<feature>/page.tsx`
2. Workspace UI: `components/dashboard/<role>-<feature>-workspace.tsx`
3. Data fetch: `lib/repositories/*-repository.ts`
4. Mutations (writes): `app/actions/*.ts`
5. Rules/business logic: `lib/services/*.ts` + `lib/validators/*.ts`
6. Database schema: `legacy ORM/schema.legacy ORM` + `legacy ORM/migrations/*`

If you only remember one thing: start at `app/(dashboard)/**/page.tsx`, then follow imports.

## What To Ignore First

When making product changes, ignore these unless you intentionally need them:

- `.claude/`, `.agents/`, `.continue/` (tooling/assistant metadata)
- `docs/references/` binary files (PDF/images used for import/reference)
- `node_modules/`, `.next/`, `tsconfig.tsbuildinfo`

## Edit Map: Admin

Use this table when you want to change a specific Admin surface.

| What you want to change | Start page | Main workspace | Main repository | Main action(s) |
|---|---|---|---|---|
| Admin overview dashboard cards/activity | `app/(dashboard)/admin/page.tsx` | (inline + shared dashboard components) | `lib/repositories/admin-overview-repository.ts` | Usually none (read-focused page) |
| Clients table/profile/actions | `app/(dashboard)/admin/clients/page.tsx` | `components/dashboard/admin-clients-workspace.tsx` (create/edit/delete wired) | `lib/repositories/admin-client-repository.ts` | `app/actions/admin-clients.ts`, `app/actions/admin-payments.ts` |
| Coaches management | `app/(dashboard)/admin/coaches/page.tsx` | `components/dashboard/marvel-ops-admin-view.tsx` (`view="coaches"`, **read-only** — no add/edit/remove UI) | `lib/repositories/admin-coach-repository.ts` | `app/actions/admin-coaches.ts` exists but nothing in the live UI calls it; the wired version is the orphaned `components/dashboard/admin-coaches-command-center.tsx` |
| Leads / trials ("Join requests") | `app/(dashboard)/admin/join-requests/page.tsx` | `components/dashboard/marvel-ops-admin-view.tsx` (`view="leads"`) | `lib/repositories/admin-lead-repository.ts`, `admin-group-repository.ts` | `app/actions/admin-leads.ts` |
| Schedule board | `app/(dashboard)/admin/schedule/page.tsx` | `components/dashboard/marvel-ops-schedule-workspace.tsx` (**read-only prototype** — week-arrows only relabel, requests are hardcoded to `[]`, approve/decline only touches local state) | `lib/repositories/admin-schedule-repository.ts` | Real actions exist (`admin-sessions.ts`, `admin-recurring-sessions.ts`, `admin-session-bookings.ts`) but nothing on this page calls them |
| Groups | `app/(dashboard)/admin/groups/page.tsx` | `components/dashboard/marvel-ops-groups-workspace.tsx` (**read-only** — open/close attendance only) | `lib/repositories/admin-group-repository.ts` | `app/actions/admin-groups.ts` exists but is unwired here |
| Attendance | `app/(dashboard)/admin/attendance/page.tsx` | `components/dashboard/admin-attendance-workspace.tsx` (live check-in flow, wired) | `lib/repositories/admin-attendance-repository.ts` | `app/actions/admin-attendance.ts` |
| Subscriptions | `app/(dashboard)/admin/subscriptions/page.tsx` | `components/dashboard/marvel-ops-groups-subscriptions.tsx` (exports `MarvelOpsSubscriptions`) | `lib/repositories/admin-subscription-repository.ts` | `app/actions/admin-subscriptions.ts` |
| Reports | `app/(dashboard)/admin/reports/page.tsx` | `components/dashboard/marvel-ops-admin-meta.tsx` (exports `MarvelOpsReports` — four stat tiles only, no trends/export) | `lib/repositories/admin-overview-repository.ts` | None |
| Notifications | `app/(dashboard)/admin/notifications/page.tsx` | `components/dashboard/marvel-ops-notifications.tsx` | `lib/repositories/notification-repository.ts` | `app/actions/notifications.ts` |
| Studio settings | `app/(dashboard)/admin/settings/page.tsx` | `components/dashboard/admin-settings-workspace.tsx` | `lib/repositories/admin-settings-repository.ts` | `app/actions/admin-settings.ts` |

Notes:

- The following routes named in the pre-redesign version of this table **do not exist**: `/admin/sessions`, `/admin/profile`, `/admin/bulk-import`, `/admin/blocks`. Their actions/repositories (`admin-profile.ts`, `admin-bulk-import.ts`, `admin-session-repository.ts` consumers, etc.) are parked/orphaned, not deleted.
- `/admin/subscriptions` is a real live page, not a redirect to `/admin/clients`.
- Several components and server actions are fully built but **have no live UI wired to them** (coaches CRUD, groups CRUD, schedule create/cancel/book, cash-out). Check `docs/system-audit-2026-07-18.md` §1–2 and §9.1 for the current, dated list before assuming a file is dead code — and before assuming this list is still accurate, since the redesign gaps are actively being closed (e.g. the clients CRUD row above was fixed after that audit was written).

## Edit Map: Client + Coach

| Role surface | Start page | Main workspace | Main repository | Main action(s) |
|---|---|---|---|---|
| Coach today / on-my-phone | `app/(dashboard)/coach/page.tsx`, `app/(dashboard)/coach/sessions/page.tsx` | `components/dashboard/marvel-ops-coach.tsx` (`MarvelOpsCoachToday`, `MarvelOpsCoachPhone`) — **read-only**, no notes/mark-done/upload UI | `lib/repositories/coach-session-repository.ts` | `coach-session-bookings.ts`, `coach-session-notes.ts`, `coach-client-assets.ts` exist but no coach page calls them |
| Coach clients / schedule | `app/(dashboard)/coach/clients/page.tsx`, `app/(dashboard)/coach/schedule/page.tsx` | `components/dashboard/marvel-ops-coach-data.tsx` (`MarvelOpsCoachClients`, `MarvelOpsCoachSchedule`) — read-only | `lib/repositories/coach-client-repository.ts`, `coach-session-repository.ts` | None wired |
| Coach alerts | `app/(dashboard)/coach/alerts/page.tsx` | `components/dashboard/marvel-ops-notifications.tsx` (same component as admin notifications; sidebar label "Injuries & changes" doesn't match the generic content) | `lib/repositories/notification-repository.ts` | `app/actions/notifications.ts` |
| Client portal | **Does not exist.** No `app/(dashboard)/client/*` route in the current tree. A client-role login lands on `app/portal-unavailable/page.tsx`. | — | `client-dashboard-repository.ts` is parked/orphaned | `client-settings.ts`, `client-check-ins.ts`, `client-private-notes.ts` are parked/orphaned |

## Common Change Scenarios

### 1) "I need to change text/button/layout on a page"

Start at workspace component:

- `components/dashboard/<role>-<feature>-workspace.tsx`
- plus shared UI atoms in `components/dashboard/dashboard-*.tsx`

### 2) "I need to change which data appears"

Start at repository:

- `lib/repositories/*-repository.ts`
- then ensure page passes props correctly from `app/(dashboard)/**/page.tsx`

### 3) "I need to change create/update/delete behavior"

Start at server actions + services:

- `app/actions/*.ts`
- `lib/services/*.ts`
- `lib/validators/*.ts` for input schema rules

### 4) "I need database field/schema changes"

Start at:

- create a migration under `supabase/migrations/` (the live schema source — see root `README.md`)
- run `npm run supabase:reset` then `npm run supabase:types` to regenerate `lib/supabase/database.types.ts`
- then update repository/action types and mapping

Note: `prisma/` only contains old migrations and is not an active dependency (`package.json` has no `prisma` package) — don't edit there.

## Fast Search Commands

Use these to locate ownership quickly from terminal:

```powershell
# Find where a route is used
git grep -n "/admin/schedule"

# Find where an action is imported
git grep -n "saveAdminSettings"

# Find all workspace components
Get-ChildItem components/dashboard -Filter "*workspace.tsx"

# Find all repositories
Get-ChildItem lib/repositories -Filter "*repository.ts"
```

## How To Brief Another AI/Teammate

Use this template:

```text
Goal:
- I want to change <feature> so that <outcome>.

Current entry file:
- app/(dashboard)/<role>/<feature>/page.tsx

Likely UI file:
- components/dashboard/<role>-<feature>-workspace.tsx

Likely backend files:
- app/actions/<action>.ts
- lib/repositories/<repo>.ts
- lib/services/<service>.ts

Constraints:
- Keep route paths unchanged
- Keep role checks with requireRole
- Revalidate affected paths after writes
```

If this file becomes stale, update it in the same PR as the feature change.
