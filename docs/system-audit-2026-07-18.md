# Full System Audit — Marvel Fitness Studios Ops

**Date:** July 18, 2026
**Scope:** Everything — frontend pages, buttons, dialogs, backend actions, API routes, database, auth, tests, repo hygiene.
**Method:** Static analysis (lint, typecheck, full unit test run, code reading of every route/action/repository) + live browser testing of every page as admin and coach (clicking through navigation, dialogs, forms, login flows, role guards, mobile viewport) + direct read-only inspection of the Supabase database and its security/performance advisors.
**Rule followed:** Nothing was changed, added, or removed. This document only records problems and why they happen.

---

## 1. CRITICAL — must fix before real use

### 1.1 Settings are silently reset to defaults every time the settings page loads
**Where:** [admin-settings-repository.ts:25-38](lib/repositories/admin-settings-repository.ts)
**What:** `AdminSettingsRepository.get()` performs an **`upsert` with the hard-coded default settings** as its way of reading the row. That means every visit to `/admin/settings` (or any page that calls `get()`) *writes the defaults over whatever the admin previously saved*. Saving works ([admin-settings.ts](app/actions/admin-settings.ts) upserts correctly), but the next page load wipes it.
**Why it happens:** The upsert-on-read was written as a "create the row if missing" shortcut, but Postgres `upsert` updates all supplied columns when the row *does* exist. The read should be a `select` with an insert only when nothing is found (or `upsert` with `ignoreDuplicates`).

### 1.2 The live Clients workspace has no create/edit/delete — the "New client" button is a disabled stub
**Where:** [marvel-ops-admin-view.tsx:92](components/dashboard/marvel-ops-admin-view.tsx) — `disabled title="Client creation will be connected to the database next"`.
**What:** On `/admin/clients` you cannot add, edit, or delete a member. The button does nothing (confirmed in browser). Yet a **fully working implementation already exists** in [admin-clients-workspace.tsx](components/dashboard/admin-clients-workspace.tsx) — search, filters, sort, pagination, create/edit dialog, guarded delete — wired to real server actions ([admin-clients.ts](app/actions/admin-clients.ts): `saveAdminClient`, `deleteAdminClient`). That component is **no longer imported by any page**.
**Why it happens:** The "Marvel Ops" visual redesign replaced the functional workspaces with new prototype-styled components ported from the design mockup (`Marvel Ops.html` at repo root) and only re-wired *some* of the data flows. The CRUD plumbing was left behind in the orphaned components.

### 1.3 Schedule "Change requests" Approve/Decline is fake — decisions vanish on refresh
**Where:** [marvel-ops-schedule-workspace.tsx:17-18,41](components/dashboard/marvel-ops-schedule-workspace.tsx)
**What:** Approving or declining a change request only updates local React state (`setResolved`). No server action is called, nothing is written to the database, and a page refresh restores the request. An admin will believe they approved something that never happened.
**Why it happens:** The panel was built as a visual prototype; the backend for storing/approving client change requests was never connected (there is even an explicit gap note in the orphaned [coach-today-operations.tsx:47](components/dashboard/coach-today-operations.tsx): "The database records completed schedule changes, but it does not yet store client change requests").

### 1.4 Schedule week navigation is fake
**Where:** [marvel-ops-schedule-workspace.tsx:20-28](components/dashboard/marvel-ops-schedule-workspace.tsx)
**What:** The ‹ › week arrows only change the header label ("1 week ahead", "2 weeks back"). The sessions shown are always the same list — the component never refetches or filters by the offset. Users think they're seeing next week; they're seeing this week relabeled.
**Why it happens:** `weekOffset` is used only in the label template; the session list passed from the server is a single static week and the offset is never sent back to the repository.

### 1.5 The whole schedule/session management surface is read-only despite a complete backend
**What:** There is no UI anywhere to create a session, cancel a session, edit a recurring template, or book/unbook a client — even though the server actions exist and are tested: [admin-sessions.ts](app/actions/admin-sessions.ts) (`saveAdminSession`, `cancelAdminSession`, `bulkUpdateAdminSessions`), [admin-recurring-sessions.ts](app/actions/admin-recurring-sessions.ts), [admin-session-bookings.ts](app/actions/admin-session-bookings.ts). The old wired UI ([admin-schedule-workspace.tsx](components/dashboard/admin-schedule-workspace.tsx)) is orphaned, and the deleted `/admin/sessions` + `/admin/schedule/templates` pages were its entry points.
**Why it happens:** Same redesign gap as 1.2 — pages were deleted/replaced before their functionality was re-homed.

### 1.6 Intermittent server crash on first load of /admin/groups
**What:** During testing, the first navigation to `/admin/groups` returned the generic "This page couldn't load — A server error occurred" screen (error digest 2539079663). A reload succeeded. This should be impossible for read pages, because every repository read is wrapped in `withSupabaseFallback`.
**Why it happens (likely):** Something in that page's render path throws *outside* the fallback wrapper (e.g., mapping/formatting code in the page component after data returns, or a transient dev-compile race). Needs the server-side stack trace to pin down; worth reproducing with the dev-server console visible. Because errors are swallowed elsewhere (see 6.1), this class of bug is hard to observe.

---

## 2. MAJOR — missing functionality the ops team will hit immediately

### 2.1 Coach workspace is 100% read-only
No coach-facing write exists in the live UI: no session notes, no marking a session done, no client asset upload, nothing. Meanwhile the backend has complete, auth-guarded actions sitting unused: [coach-session-notes.ts](app/actions/coach-session-notes.ts), [coach-session-bookings.ts](app/actions/coach-session-bookings.ts), [coach-client-assets.ts](app/actions/coach-client-assets.ts), [coach-settings.ts](app/actions/coach-settings.ts). Grep confirms no dashboard component imports any coach action.

### 2.2 No coach management UI
`/admin/coaches` shows load cards only. You cannot add, edit, or remove a coach, though `saveCoach`/`deleteCoach` exist in [admin-coaches.ts](app/actions/admin-coaches.ts) and the orphaned [admin-coaches-command-center.tsx](components/dashboard/admin-coaches-command-center.tsx) once used them.

### 2.3 No group management UI
`/admin/groups` cards open a read-only drawer (Close / Open attendance only). No create group, no edit schedule/capacity, no assign coach, no add/remove member — despite [admin-groups.ts](app/actions/admin-groups.ts) actions and the orphaned 434-line [admin-groups-workspace.tsx](components/dashboard/admin-groups-workspace.tsx).

### 2.4 Cash-out flow unreachable
[admin-cash-out-dialog.tsx](components/dashboard/admin-cash-out-dialog.tsx) (and [admin-payments.ts](app/actions/admin-payments.ts)) are only referenced by the orphaned `admin-today-operations.tsx`. The command palette's "Record cash out" action just navigates to `/admin/subscriptions`, where no cash-out control exists.

### 2.5 No client detail page — only a thin drawer
The client drawer (name, injury, sessions left, phone, plan, Renew, WhatsApp) is the entire client profile. No payment history view (receipts list exists only in the orphaned workspace), no attendance history, no notes, no edit. The drawer is addressed by **client name** in the URL (`/admin/clients?profile=Ali%20Hassan`) and rows are keyed by phone number — two clients with the same name or a missing/duplicate phone will break selection/rendering ([marvel-ops-admin-view.tsx:88-93](components/dashboard/marvel-ops-admin-view.tsx)).

### 2.6 Client roster has no search, filter, sort, or pagination in the live UI
The rendered list is a flat map of every client. Fine at 14 demo clients; unusable at a real studio's 100+. The orphaned workspace had all of it (search box, 4 filters, A-Z sort, pagination — [admin-clients-workspace.tsx:219-229](components/dashboard/admin-clients-workspace.tsx)). Related: `totalCount` / `filteredCount` props are accepted and ignored (the 2 ESLint warnings).

### 2.7 No password reset / forgot-password flow
Login's only recovery path is "Need access? Contact the studio administrator", and there is no admin UI to reset a user's password or issue a temporary one (the backend concept exists — `mustChangePassword` + [account-security.ts](app/actions/account-security.ts) — but no admin surface triggers it).

### 2.8 Reports page is a stub
`/admin/reports` shows four stat tiles that restate numbers visible elsewhere. No time ranges, no trends, no attendance/revenue breakdowns, no export. It presents itself as "Live studio report" but has no report content.

### 2.9 No client-facing communication beyond a WhatsApp deep link
Renewal reminders/notifications go to admin/coach recipients only. There is no way to message a client from the system except opening wa.me links by hand.

---

## 3. LOGIC AND DATA-CONSISTENCY PROBLEMS

### 3.1 Two parallel "trial" pipelines that don't agree
- Today page "Trials to close" lists **Clients** with `TRIAL` lifecycle status (Yassin Adel, Tamer Fouad).
- `/admin/join-requests` lists **Lead** rows in a kanban (different people: Hana Mahmoud, Rana Ehab, …).
A trial booked in the leads kanban does not appear in "Trials to close" until the lead is converted to a Client, and a Trial client no longer appears in the leads pipeline. Two sources of truth for "who is trialing" will produce contradictory dashboards.
**Why:** The leads feature (Lead table) and the client lifecycle (Client.status) were built at different times and never reconciled.

### 3.2 Trial clients shown as ACTIVE subscribers
On `/admin/subscriptions`, Yassin Adel and Tamer Fouad (Trial clients) appear with status "ACTIVE" and the header says "0 TRIAL ACCOUNTS". The subscription status and client lifecycle status are stored and mapped independently ([admin-subscriptions.ts](app/actions/admin-subscriptions.ts) maps "Trial" → `TRIAL`, but the seeded/derived data doesn't align).

### 3.3 Week-start inconsistency
Settings say "Schedule starts: Monday" (default), but the schedule grid and groups pages hard-code the week as `["Sat", "Sun", "Mon", …]` ([marvel-ops-schedule-workspace.tsx:13](components/dashboard/marvel-ops-schedule-workspace.tsx)). The setting is stored but nothing reads it. Same for most other settings (session length, buffers, cancellation window) — no consumer was found in the live code path, so the entire settings page is effectively decorative.

### 3.4 Groups say "SUN" but sessions run today (Saturday)
Group cards show schedule "Sun 7:00 AM" etc., while the Today page shows those same classes happening on Saturday. Either the seed data's `day` values or the day-index mapping (0=Sat vs 0=Sun) is off by one somewhere between `Group`/`RecurringSessionTemplate` and the Today/Groups repositories.

### 3.5 Stale `revalidatePath` targets
Actions revalidate routes that no longer exist: `/admin/sessions`, `/admin/leads`, `/admin/bulk-import`, `/admin/profile`, `/admin/schedule/templates`, `/client/*` (30+ call sites across [app/actions](app/actions) — e.g. [admin-attendance.ts:13-20](app/actions/admin-attendance.ts), [admin-leads.ts:17-39](app/actions/admin-leads.ts)). Harmless at runtime but misleading, and some *live* pages are consequently **not** revalidated when they should be (e.g., schedule mutations never revalidate `/admin/groups`).

### 3.6 Demo/seed data confusion: two admin accounts
Notifications exist in the DB (5 rows) but the admin notifications page shows 0 — because they belong to `admin@marvelfitness.demo`, while the account you log in with is `admin@test.com`. Similarly, the "Coach User" placeholder account appears in the public coaches grid with 0 clients (see 7.3). There is no `client@test.com` (client demo logins fail with "Invalid email or password").
**Why:** Two generations of seed data (July 14 `@test.com` accounts; July 18 `@marvelfitness.demo` demo cast) coexist.

### 3.7 Notification centre reachable by coaches under two names
`/coach/alerts` renders the same generic notification centre component as `/admin/notifications` (filters "Sessions / Renewals / System"), but the sidebar sells it as "Injuries & changes". Content does not match the promise; injury changes are not what the notification kinds model.

---

## 4. SECURITY

### 4.1 Two SECURITY DEFINER functions callable by anonymous users (Supabase advisor, WARN)
`public.create_payment_ledger_entry()` and `public.log_training_session_change()` are executable by the `anon` role via PostgREST (`/rest/v1/rpc/...`). A stranger with the public anon key could invoke definer-privileged functions. Remediation guidance: [Supabase lint 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). They are also callable by any `authenticated` role (lint 0029).
**Why:** Postgres grants EXECUTE to PUBLIC by default; the migrations that created these trigger-helper functions never revoked it.

### 4.2 RLS enabled with zero policies on all ~35 tables (advisor INFO)
Default-deny means the anon key can't read data (good), but it also means the entire app depends on the **service-role key** for every operation. Any future leak of that key, or any code path that accidentally uses the anon client for writes, fails closed/open in unplanned ways. This is a deliberate architecture choice (app-layer auth via `requireRole`) but it should be documented and the anon key's surface (see 4.1) minimized.

### 4.3 Positives worth keeping (verified)
- Every server action checks `requireRole`/`requireUser` ([lib/auth/session.ts](lib/auth/session.ts)) and re-validates the user still exists in the DB.
- Login rate-limiting exists (`AuthThrottle`, `SecurityEvent` — 28 events recorded) via [auth-security-service](lib/auth/auth-security-service.ts).
- Receipts and file downloads check ownership ([app/api/receipts/[receiptId]/route.ts](app/api/receipts/%5BreceiptId%5D/route.ts), [app/api/files/[fileId]/download/route.ts](app/api/files/%5BfileId%5D/download/route.ts)), escape HTML, and send `no-store`.
- Cron endpoint requires `CRON_SECRET` bearer token.
- Role guards proven in browser: admin↔coach cross-access redirects correctly; deleted/parked routes 404 or redirect; middleware + per-layout guard + mustChangePassword redirect all present.
- One nit: the receipts route trusts `data.client` to be non-null (`data.client.userId`) — a ledger entry with a deleted client would throw a 500 instead of 404.

---

## 5. RELIABILITY / ERROR-HANDLING

### 5.1 Silent database-failure fallback hides outages
Every read repository wraps queries in `withSupabaseFallback` ([lib/supabase/errors.ts:22-38](lib/supabase/errors.ts)), which on ANY error logs a console warning and renders empty/fallback data. If Supabase is down or a query breaks, the admin sees "0 clients, all caught up, no sessions" — a **plausible but false** picture of the business — with no banner or indicator. This was a deliberate render-safety choice, but with no surfaced signal it converts infrastructure failures into silent data lies. (Known tech debt; re-confirmed still present.)

### 5.2 Hourly automation has never run
`vercel.json` defines the hourly cron for `/api/cron/studio-automation`, but the `AutomationRun` table has **0 rows** — the renewal/session notification engine has never executed in this environment. Locally nothing calls it, and production has either not deployed it or `CRON_SECRET` is missing/mismatched. Everything downstream (notification centre content, renewal nudges) is therefore untested end-to-end.

---

## 6. TEST SUITE HEALTH — 8 failing tests, 4 failing files (`vitest run`: 327 pass / 8 fail)

| Failing file | Why it fails |
|---|---|
| `lib/navigation/dashboard-nav.test.ts` (3) | Stale expectations: expects `/admin/sessions` route meta "Sessions" (route deleted), a "Client account" profile (client role now collapses to coach meta), and a client "Progress" sidebar item (client nav intentionally returns `[]`). |
| `tests/admin-coaches-command-center-contract.test.ts` (3) | Contract test for the OLD coaches command center; the route now renders `MarvelOpsAdminView`, so "keeps real mutations" (rightly) fails — it's actually documenting finding 2.2. |
| `tests/redline-foundation-contract.test.ts` (1) | Expects `app/page.tsx` to contain a role-based `redirect(session?.user?.role…)`; the page now unconditionally redirects to `/login`. |
| `tests/dashboard-shell-interaction.test.tsx` (1) | Broken test infrastructure: the `next/navigation` mock lacks `useRouter`, which the command palette now uses. Not a product bug. |

**Why:** The redesign changed navigation/entry behavior without updating the contract tests, so the suite is red and can no longer act as a regression gate (`npm run verify` fails). E2E coverage is a single spec (`e2e/auth.spec.ts`).

---

## 7. UI / UX / CONTENT POLISH

1. **Pluralization bugs:** "1 sessions/wk", "1 clients" (coaches page), "in 1 days" (subscriptions). Formatters interpolate the number into a fixed plural string.
2. **Unlabeled icon buttons:** Many buttons expose no accessible name (session rows, lead cards, stat tiles — seen as anonymous `button` refs in the accessibility tree on Today/Clients pages). Screen readers and testing tools can't identify them; add `aria-label`s.
3. **"Coach User" placeholder visible in the real UI** on `/admin/coaches` ("COACH USER HAS NO ASSIGNED CLIENTS YET") — a dev login account rendered as a real coach because the coaches list is just "all Coach rows".
4. **Login offers "Client ID / Phone" as the default tab** on an admin/coach-only ops tool. Real clients who log in land on `/portal-unavailable`. Either the tab order is wrong (email should be default for staff) or the copy should say staff sign-in.
5. **Duplicate DOM forms:** `/admin/settings` renders every input twice (two identical forms in the DOM — desktop/mobile duplication). Doubles the tab order for keyboard users and risks submitting the stale copy.
6. **Settings has no per-field validation feedback** and "Changes apply to future operations" is untrue today (settings are consumed by nothing — see 3.3, and are reset by 1.1).
7. **Empty coach demo experience:** `coach@test.com` has no group/session/client links, so every coach page renders empty states — you cannot demo or manually test the coach workflows without creating data by hand.
8. **Command palette actions oversell:** "New member" just navigates to `/admin/clients` where creation is disabled (1.2); "Record cash out" navigates to a page with no cash-out (2.4).
9. **Root URL behavior:** `/` always redirects to `/login` ([app/page.tsx](app/page.tsx)) and logged-in users then bounce login→dashboard. Works, but produces a double redirect on every visit; also the sitemap ([app/sitemap.ts](app/sitemap.ts)) only lists `/login` — fine for an internal tool, but the marketing/landing page and `/join` funnel were removed entirely, so the public web presence is now just a login form (confirm this is intended).
10. Mobile viewport (375px) shows no horizontal overflow on the pages tested; the shell renders. But mobile drawer behavior is untested by machines (6) and was not verifiable end-to-end here.

## 8. PERFORMANCE (Supabase advisors + code)

1. **~23 foreign keys without covering indexes** (`Client.groupId`, `Payment.clientId`, `Payment.clientSubscriptionId`, `Group.coachId`, `RecurringSessionTemplate.*`, etc.). Joins and cascades will degrade as data grows. Full list: Supabase performance advisor, [lint 0001](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).
2. **`VerificationToken` has no primary key** ([lint 0004](https://supabase.com/docs/guides/database/database-linter?lint=0004_no_primary_key)).
3. Several indexes never used (`User_clientId_idx`, `Client_trainingCategory_idx`, `Group_isActive_idx`, …) — expected at demo scale, revisit later.
4. Dashboard pages fetch full tables (`adminClientRepository.list()` returns every client) with client-side filtering only — same scaling concern as 2.6.

## 9. DEAD CODE / REPO HYGIENE

1. **Orphaned but fully functional components** (nothing imports them): `admin-clients-workspace`, `admin-subscriptions-workspace`, `admin-coaches-command-center`, `admin-groups-workspace`, `admin-leads-workspace`, `admin-schedule-workspace`, `admin-today-operations`, `coach-today-operations`, `coach-phone-operations`, `admin-cash-out-dialog`, `session-type-picker` (+ their CSS modules). Decide per component: re-wire (most contain the missing functionality from §2) or delete.
2. **Orphaned server actions:** everything in §2 plus `admin-bulk-import.ts`, `admin-profile.ts`, `client-*.ts`, `coach-transformation.ts` (parked features — intentional), `landing.ts`/`join-now-types.ts` (the `/join` funnel was deleted; its actions/tests remain).
3. **`lib/mocks/` still the type home:** live components import types from `@/lib/mocks/admin-*` (e.g. [admin-subscriptions.ts:9](app/actions/admin-subscriptions.ts)). Known tech debt — domain types living in files named "mocks" misleads readers.
4. **Design artifacts committed to the repo root:** `Marvel Ops.html` (700 KB mockup), `Marvel Fitness Studios operations system/` (design handoff bundle incl. `.thumbnail`, `support.js`). Should live in `docs/` or out of the repo.
5. **Generated/test output tracked or lying around:** `output/`, `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo` at root.
6. **Last commit message is `///`** — history from the redesign is otherwise well-messaged; this one commit (144b3b79, the entire redesign landing) is unsearchable.
7. `.claude/skills/` references two missing directories (`browser-use`, `frontend-design`) — git prints warnings on every command.
8. `docs/WHERE_TO_EDIT.md` and several docs under `docs/architecture` predate the Marvel Ops redesign — verify before trusting them.
9. `scripts/promote-leads-to-clients.cjs` (npm script `promote:leads`) references the pre-kanban leads flow; likely stale.
10. `prisma/` contains only `migrations` — Prisma is referenced by `.env` comments but isn't a dependency; confusing leftover.

## 10. WHAT VERIFIABLY WORKS (so it's not re-audited later)

- Login (email + wrong-password error + rate-limit plumbing), logout, session persistence, role-based redirects, parked-route redirects, 404s.
- Today dashboard, Attendance (live check-in flow wired via `markAttendance`; `?session=` deep link honored), Leads kanban (add lead, assign to group, mark trial done, subscribe — wired to `admin-leads` actions), Subscriptions (renew/lifecycle wired; receipts render and print), Groups (read-only view), Coaches (read-only view), Reports (stub but renders), Notifications (renders; correct per-recipient scoping), Settings (renders; but see 1.1/3.3).
- Coach shell and all five coach pages render without errors (empty-state only, see 7.7).
- ESLint: clean (2 unused-var warnings). TypeScript: clean. No browser console errors on any page visited.

---

## Suggested fix order (when you start fixing)

1. **1.1** settings clobber (small, data-destroying).
2. **4.1** revoke anon EXECUTE on the two definer functions (two `REVOKE` statements).
3. **1.2 / 2.x** decide the strategy: re-wire the orphaned workspaces into the Marvel Ops shell (fastest path to full CRUD) vs. rebuilding CRUD inside the new components — then apply consistently to clients, coaches, groups, schedule, cash-out.
4. **1.3 / 1.4** remove or finish the fake schedule interactions (dishonest UI is worse than absent UI).
5. **6** fix/update the failing tests so `npm run verify` gates again.
6. **3.x** reconcile trials pipelines, week-start, day-offset, revalidate paths.
7. **5.1** add a visible "data unavailable" state to the fallback path; **5.2** deploy/verify the cron.
8. §7 polish, §8 indexes, §9 cleanup.
