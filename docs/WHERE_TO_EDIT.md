# Where To Edit (Project Navigation Guide)

This file exists to solve one problem: when you want to change something, you can quickly find the right file without guessing.

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
| Clients table/profile/actions | `app/(dashboard)/admin/clients/page.tsx` | `components/dashboard/admin-clients-workspace.tsx` | `lib/repositories/admin-client-repository.ts` | `app/actions/admin-clients.ts`, `app/actions/admin-payments.ts` |
| Coaches management | `app/(dashboard)/admin/coaches/page.tsx` | `components/dashboard/admin-coaches-command-center.tsx` | `lib/repositories/admin-coach-repository.ts` | `app/actions/admin-coaches.ts` |
| Join requests / leads approval | `app/(dashboard)/admin/join-requests/page.tsx` | `components/dashboard/admin-leads-workspace.tsx` | `lib/repositories/admin-lead-repository.ts` | `app/actions/admin-leads.ts` |
| Schedule board | `app/(dashboard)/admin/schedule/page.tsx` | `components/dashboard/admin-schedule-workspace.tsx` | `lib/repositories/admin-schedule-repository.ts` | `app/actions/admin-schedule-blocks.ts`, `app/actions/admin-attendance.ts` |
| Sessions board | `app/(dashboard)/admin/sessions/page.tsx` | `components/dashboard/admin-sessions-workspace.tsx` | `lib/repositories/admin-session-repository.ts` | `app/actions/admin-sessions.ts`, `app/actions/admin-session-bookings.ts` |
| Studio settings | `app/(dashboard)/admin/settings/page.tsx` | `components/dashboard/admin-settings-workspace.tsx` | `lib/repositories/admin-settings-repository.ts` | `app/actions/admin-settings.ts` |
| Profile page | `app/(dashboard)/admin/profile/page.tsx` | `components/dashboard/admin-profile-workspace.tsx` | `lib/repositories/admin-profile-repository.ts` | `app/actions/admin-profile.ts` |
| Bulk CSV import | `app/(dashboard)/admin/bulk-import/page.tsx` | `components/dashboard/admin-bulk-import-workspace.tsx` | (service-driven) | `app/actions/admin-bulk-import.ts`, `lib/services/bulk-client-import.ts` |

Notes:

- `/admin/blocks` is the dedicated recurring block management surface.
- `/admin/subscriptions` is currently a redirect page to `/admin/clients`.

## Edit Map: Client + Coach

| Role surface | Start page | Main workspace | Main repository | Main action(s) |
|---|---|---|---|---|
| Client overview/coach/sessions/subscription/settings | `app/(dashboard)/client/*/page.tsx` | `components/dashboard/client-*-workspace.tsx` | `lib/repositories/client-dashboard-repository.ts` | `app/actions/client-settings.ts` |
| Coach overview/clients/schedule/sessions/settings | `app/(dashboard)/coach/*/page.tsx` | `components/dashboard/coach-*-workspace.tsx` | `lib/repositories/coach-*-repository.ts` | `app/actions/coach-session-bookings.ts`, `app/actions/coach-session-notes.ts`, `app/actions/coach-settings.ts` |

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

- `legacy ORM/schema.legacy ORM`
- create migration under `legacy ORM/migrations/`
- then update repository/action types and mapping

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
