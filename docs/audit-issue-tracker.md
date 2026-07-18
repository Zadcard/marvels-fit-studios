# Audit Issue Tracker

Derived from `docs/system-audit-2026-07-18.md`. That document is prose; this is a checklist version so items can be tracked to closed without re-reading it each time.

**Status column** reflects what a live re-check of the referenced files showed as of **2026-07-18, later same day as the audit** — not just what the audit said. Several items had already moved. Re-verify anything you're about to rely on; this codebase is changing quickly (see caveat at the bottom).

| ID | Severity | Status | Area | Files | Issue | Suggested fix |
|---|---|---|---|---|---|---|
| 1.1 | Critical | ✅ Resolved (verified) | Settings | `lib/repositories/admin-settings-repository.ts` | `get()` used to `upsert` the hard-coded defaults, clobbering saved settings on every page load. | N/A — repository now does `select` → `insert` only if missing. No action needed. |
| 1.2 | Critical | ✅ Resolved (verified) | Clients CRUD | `app/(dashboard)/admin/clients/page.tsx`, `components/dashboard/admin-clients-workspace.tsx` | "New client" was a disabled stub; the working CRUD component was orphaned. | N/A — the page now imports `admin-clients-workspace.tsx`, whose "New client" button calls `openCreate` (not disabled), and it has a working save/delete form. |
| 1.3 | Critical | ❌ Still open (verified) | Schedule | `components/dashboard/marvel-ops-schedule-workspace.tsx`, `app/(dashboard)/admin/schedule/page.tsx` | Approve/Decline on change requests only sets local React state; nothing is persisted. | Page still passes `requests={[]}` hard-coded and there's no server action call in the workspace for approve/decline. Needs a request table + action + wiring, or remove the UI until built. |
| 1.4 | Critical | ❌ Still open (verified) | Schedule | `components/dashboard/marvel-ops-schedule-workspace.tsx` | Week ‹ › arrows only relabel the header; the session list never refetches by offset. | Confirmed: `admin/schedule/page.tsx` fetches one static week server-side and passes it straight through; `weekOffset` state in the workspace has nothing to trigger a refetch. |
| 1.5 | Critical | ❌ Still open (verified) | Schedule/Sessions | `admin-schedule-repository.ts`, `admin-sessions.ts`, `admin-recurring-sessions.ts`, `admin-session-bookings.ts` | No UI to create/cancel a session, edit a recurring template, or book/unbook a client, despite tested server actions existing. | Schedule page is still read-only render of `MarvelOpsScheduleWorkspace`; none of these actions are imported by any live component. |
| 1.6 | Critical | ⚠️ Unverified (needs a live browser check) | Groups | `app/(dashboard)/admin/groups/page.tsx` | Intermittent server error on first load. | Static reading can't reproduce a runtime race; needs someone to reload `/admin/groups` a few times with the dev console open. |
| 2.1 | Major | ❌ Still open (verified) | Coach workspace | `marvel-ops-coach.tsx`, `marvel-ops-coach-data.tsx` | No coach-facing writes (notes, mark-done, asset upload) even though `coach-session-notes.ts`, `coach-session-bookings.ts`, `coach-client-assets.ts`, `coach-settings.ts` exist. | All four coach pages (`coach/page.tsx`, `/sessions`, `/clients`, `/schedule`) confirmed still render read-only Marvel Ops components with none of these actions imported. |
| 2.2 | Major | ❌ Still open (verified) | Coach management | `app/(dashboard)/admin/coaches/page.tsx` → `marvel-ops-admin-view.tsx` (`view="coaches"`) | No add/edit/remove coach UI, though `admin-coaches.ts` (`saveCoach`/`deleteCoach`) exists. | Confirmed the live page still renders the read-only `MarvelOpsAdminView`, not the orphaned `admin-coaches-command-center.tsx`. Same fix pattern as 1.2 (re-wire or rebuild). |
| 2.3 | Major | ❌ Still open (verified) | Group management | `app/(dashboard)/admin/groups/page.tsx` → `marvel-ops-groups-workspace.tsx` | Groups drawer is read-only (open/close attendance only); no create/edit/assign/add-member despite `admin-groups.ts`. | Confirmed unchanged since audit. |
| 2.4 | Major | ⚠️ Not re-checked | Cash-out | `admin-cash-out-dialog.tsx`, `admin-payments.ts` | Command palette's "Record cash out" just navigates to `/admin/subscriptions`, which has no cash-out control. | Per audit; not independently re-verified this pass. |
| 2.5 | Major | ⚠️ Not re-checked | Client detail | `marvel-ops-admin-view.tsx` | Client "profile" is a thin drawer, addressed by name in the URL, rows keyed by phone — collision risk with duplicate/missing phone numbers. | Per audit; worth checking against the phone-number duplicate found in `docs/references/clients.csv` (see clients-cleaned.csv). |
| 2.6 | Major | ⚠️ Likely improved, not confirmed | Client roster paging | `admin-clients-workspace.tsx` | Audit said no search/filter/sort/pagination in the live UI. | Since 1.2 shows this component is now the live one, and the orphaned version the audit describes *had* search/filter/sort/pagination built in, this finding may already be resolved as a side effect. Worth a 2-minute browser check rather than assuming. |
| 2.7 | Major | ⚠️ Not re-checked | Password reset | `account-security.ts` | No admin UI to reset/issue a temp password. | Per audit; not independently re-verified this pass. |
| 2.8 | Major | ❌ Still open (verified) | Reports | `app/(dashboard)/admin/reports/page.tsx` → `marvel-ops-admin-meta.tsx` (`MarvelOpsReports`) | Four stat tiles only, no ranges/trends/export. | Confirmed unchanged. |
| 2.9 | Major | ⚠️ Not re-checked | Client comms | — | No in-system messaging beyond WhatsApp deep links. | Per audit; product decision as much as a bug. |
| 3.1–3.7 | Logic/data | ⚠️ Not re-checked | Various | See audit | Trial pipeline duplication, subscription/lifecycle mismatch, week-start inconsistency, day-offset bug, stale `revalidatePath` targets, dual demo accounts, coach alerts naming. | Re-verify against live data before fixing; some may shift as 1.x/2.x items get wired up (e.g. fixing schedule wiring likely touches 3.3/3.4). |
| 4.1 | Security | ⚠️ Not re-checked | DB | Supabase migrations | `anon`/`authenticated` roles can execute two `SECURITY DEFINER` functions via PostgREST. | Two `REVOKE EXECUTE` statements in a new migration; low effort, do this early regardless of other work in flight. |
| 4.2 | Security | Informational | DB | — | RLS enabled, zero policies, app relies entirely on service-role key. | Documented architecture choice per audit; not a bug to "fix" so much as a risk to keep in mind. |
| 5.1 | Reliability | ⚠️ Not re-checked | All read repos | `lib/supabase/errors.ts` (`withSupabaseFallback`) | Any Supabase error is swallowed and renders empty/fallback data with no visible signal. | Per audit; add a surfaced "data unavailable" state. |
| 5.2 | Reliability | ⚠️ Not re-checked | Cron | `vercel.json`, `/api/cron/studio-automation` | `AutomationRun` has 0 rows — cron has never run in this environment. | Per audit; verify `CRON_SECRET` and deployment. |
| 6 | Tests | ⚠️ Not re-run (no shell access this session) | Test suite | `vitest run` | 8 failing / 4 failing files per audit, mostly stale contract-test expectations from before the redesign. | Can't confirm current pass/fail count without running `npm run verify` — do that before trusting this row. |
| 9.x | Hygiene | See `docs/repo-hygiene-inventory.md` | Repo | Various | Orphaned components/actions, `Marvel Ops.html` at root, generated output dirs tracked, `prisma/` leftover, bad commit message, missing `.claude/skills` dirs. | Separate inventory doc produced alongside this tracker. |

## Caveat

Rows marked "✅ Resolved (verified)" and "❌ Still open (verified)" were checked by reading the actual current files, not by trusting the audit's prose. Everything marked "⚠️" is carried over from the audit unchanged and should be re-checked before you act on it — this session had no shell access, so nothing requiring `npm run`, a live browser, or a database query could be independently confirmed.

Given that 1.1 and 1.2 were already fixed within the same day the audit was written, treat this whole list as a fast-moving target, not a snapshot to work from a week from now without re-checking.

## Pass 1 verification addendum (2026-07-18, post-merge)

Independently re-verified in the browser + database after the 9 pass-1 commits landed
(c3070e21..b16cf01b). Statuses below **override** the table above where they differ:

- **1.2 / 2.5 / 2.6 Clients CRUD — resolved & verified end-to-end**: created a test client via the UI (row confirmed in DB), found it via search, deleted it via the type-to-confirm dialog (DB row gone). Search/filter/sort/pagination live.
- **1.3 / 1.4 Schedule — resolved as scoped**: fake change-request panel removed; week arrows now drive `?week=N` and the server refetches (this week: 18 sessions, next week: 0 — future weeks are empty because the cron that materializes sessions has never run, see 5.2).
- **2.2 Coaches — resolved**: `admin-coaches-command-center.tsx` is live again; "New coach" dialog opens; placeholder "Coach User" excluded from the grid.
- **2.3 Groups — resolved**: "New group" + per-group Edit present.
- **1.1 Settings — re-verified fixed**: changed a value, saved, hard-reloaded — value persists in DB and UI.
- **3.5 / 7.1 — verified**: revalidation allowlist test present; no "1 clients"/"1 days" strings found on coaches or subscriptions pages.
- **4.1 Security — HALF DONE**: the revoke migration exists locally (`supabase/migrations/20260718130000_restrict_trigger_function_execute.sql`) but is **NOT applied to the hosted DB** — live check shows `anon` can still EXECUTE both functions. Run `supabase db push` (or apply via dashboard) to close it.
- **7.5 Settings duplicate form — still open**: the DOM still contains two identical settings forms (one visible, one hidden). Codex's report claimed one form; a fresh load shows 2.
- **1.6 Groups intermittent error — inconclusive**: one occurrence during the audit, none since; the similar error seen during verification was caused by running `next build` while the dev server was up (self-inflicted).
