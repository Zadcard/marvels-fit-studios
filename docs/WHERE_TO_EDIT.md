# Where To Edit (Project Navigation Guide)

This file exists to solve one problem: when you want to change something, you can quickly find the right file without guessing.

> **Verified 2026-07-18 (after audit pass 1).** The app is an **admin + coach operations tool**
> (client portal and transformation studio are parked — see `lib/launch-scope.ts`). Client,
> coach, and group CRUD were re-wired into the live UI in pass 1; schedule/session CRUD is
> still read-only. Known issues: `docs/system-audit-2026-07-18.md` + `docs/audit-issue-tracker.md`.
> This codebase changes fast — when a page and this table disagree, trust the imports in the page file.

## 60-Second Mental Model

Most dashboard features follow this pattern:

1. Route page (entry): `app/(dashboard)/<role>/<feature>/page.tsx`
2. Workspace UI: `components/dashboard/*.tsx` (Marvel Ops shell components are `marvel-ops-*.tsx`)
3. Data fetch: `lib/repositories/*-repository.ts`
4. Mutations (writes): `app/actions/*.ts` (every action must call `requireRole`/`requireUser`)
5. Rules/business logic: `lib/services/*.ts` + `lib/validators/*.ts`
6. Database schema: `supabase/migrations/*.sql` (applied to the hosted Supabase project)

If you only remember one thing: start at `app/(dashboard)/**/page.tsx`, then follow imports.

## Edit Map: Admin

| What you want to change | Start page | Main workspace | Main repository | Main action(s) |
|---|---|---|---|---|
| Today dashboard | `app/(dashboard)/admin/page.tsx` | `marvel-ops-today.tsx` | `admin-today-operations-repository.ts` | none (read-only) |
| Attendance / check-ins | `app/(dashboard)/admin/attendance/page.tsx` | `admin-attendance-workspace.tsx` | `admin-attendance-repository.ts` | `admin-attendance.ts` |
| Schedule week view | `app/(dashboard)/admin/schedule/page.tsx` | `marvel-ops-schedule-workspace.tsx` (week nav is URL/server-backed via `?week=N`; **no session create/cancel UI yet** — `admin-sessions.ts`, `admin-recurring-sessions.ts`, `admin-session-bookings.ts` exist but are unwired) | `admin-schedule-repository.ts` | see note |
| Leads & trials kanban | `app/(dashboard)/admin/join-requests/page.tsx` | `marvel-ops-admin-view.tsx` (`view="leads"`) | `admin-lead-repository.ts` | `admin-leads.ts` |
| Clients roster/profile (full CRUD) | `app/(dashboard)/admin/clients/page.tsx` | `admin-clients-workspace.tsx` (search/filter/sort/pagination + create/edit/guarded delete) | `admin-client-repository.ts` | `admin-clients.ts` |
| Groups (CRUD) | `app/(dashboard)/admin/groups/page.tsx` | `admin-groups-workspace.tsx` (New group / Edit / membership) | `admin-group-repository.ts` | `admin-groups.ts` |
| Coaches (CRUD) | `app/(dashboard)/admin/coaches/page.tsx` | `admin-coaches-command-center.tsx` (New coach / edit / delete; placeholder accounts excluded) | `admin-coach-repository.ts` | `admin-coaches.ts` |
| Subscriptions & renewals | `app/(dashboard)/admin/subscriptions/page.tsx` | `marvel-ops-groups-subscriptions.tsx` | `admin-subscription-repository.ts` | `admin-subscriptions.ts` |
| Reports | `app/(dashboard)/admin/reports/page.tsx` | `marvel-ops-admin-meta.tsx` (`MarvelOpsReports` — stat tiles only, no trends/export yet) | `admin-overview-repository.ts` | none |
| Notifications | `app/(dashboard)/admin/notifications/page.tsx` | `marvel-ops-notifications.tsx` | `notification-repository.ts` | `notifications.ts` |
| Studio settings | `app/(dashboard)/admin/settings/page.tsx` | `admin-settings-workspace.tsx` | `admin-settings-repository.ts` | `admin-settings.ts` |

Routes that no longer exist (parked/removed — don't reference them): `/admin/sessions`, `/admin/profile`, `/admin/bulk-import`, `/admin/blocks`, `/admin/leads`, `/admin/schedule/templates`, all `/client/*`, `/join`.

## Edit Map: Coach

| Surface | Start page | Main workspace |
|---|---|---|
| Today | `app/(dashboard)/coach/page.tsx` | `marvel-ops-coach.tsx` (`MarvelOpsCoachToday`) |
| Schedule | `app/(dashboard)/coach/schedule/page.tsx` | `marvel-ops-coach-data.tsx` |
| Clients | `app/(dashboard)/coach/clients/page.tsx` | `marvel-ops-coach-data.tsx` |
| Alerts | `app/(dashboard)/coach/alerts/page.tsx` | `marvel-ops-notifications.tsx` |
| Phone view | `app/(dashboard)/coach/sessions/page.tsx` | `marvel-ops-coach.tsx` (`MarvelOpsCoachPhone`) |

Coach repositories: `lib/repositories/coach-*-repository.ts`. Coach write actions
(`coach-session-notes.ts`, `coach-session-bookings.ts`, `coach-client-assets.ts`,
`coach-settings.ts`) exist and are auth-guarded but are **still not wired into the UI** (audit 2.1).

## Shared shell & auth

- Sidebar/topbar/command palette: `components/dashboard/dashboard-*.tsx`; nav config in `lib/navigation/dashboard-nav.ts`
- Route protection: `proxy.ts` (middleware) + per-layout guards in `app/(dashboard)/<role>/layout.tsx` + `lib/auth/authorization-policy.ts`
- Login / change-password: `app/login/`, `app/change-password/`, `components/auth/ops-auth-shell.tsx`, `auth.ts`, `lib/auth/*`
- Launch scope (parked features): `lib/launch-scope.ts`
- API routes: `app/api/receipts/[receiptId]`, `app/api/files/[fileId]/download`, `app/api/cron/studio-automation` (+ `app/api/auth`)

## Common Change Scenarios

1. **Text/button/layout** → the workspace component the page imports (see tables above).
2. **Which data appears** → `lib/repositories/*-repository.ts`, then the page's prop mapping.
3. **Create/update/delete behavior** → `app/actions/*.ts` (+ `lib/services`, `lib/validators`); keep `requireRole` and revalidate the live routes that render the data (see the revalidation allowlist test added in pass 1).
4. **Database schema** → new SQL file in `supabase/migrations/`, then update repository/action types (`lib/supabase/domain.ts`, regenerate `lib/supabase/database.types.ts` via `npm run supabase:types`).

## Fast Search Commands

```powershell
# Find where a route is used
git grep -n "/admin/schedule"

# Find where an action is imported
git grep -n "saveAdminClient"

# Which component does a page render?
Get-Content "app/(dashboard)/admin/clients/page.tsx" -TotalCount 5
```

If this file becomes stale, update it in the same PR as the feature change.
