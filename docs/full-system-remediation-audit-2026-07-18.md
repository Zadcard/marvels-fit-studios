# Full-System Remediation Audit

**System:** Marvel Fitness Studios operations application  
**Audit date:** 2026-07-18  
**Status:** Findings complete enough to begin remediation; resolution evidence will be added as fixes land.  
**Supersedes for current status:** `docs/system-audit-2026-07-18.md` and the stale rows in `docs/audit-issue-tracker.md`.

## 1. Executive summary

The application renders reliably across the current admin and coach routes, enforces role redirects, and has a substantial database-backed foundation. It is not ready for real studio operations yet. The largest risks are not cosmetic:

1. The hosted database is missing the local function-grant migration, leaving two `SECURITY DEFINER` trigger helpers executable by `anon` and `authenticated`.
2. The live `admin_save_client` and `promote_lead_to_client` definitions contain text-versus-UUID comparisons. Existing-client edits and lead promotion can fail even though create-client works.
3. Editing any client whose payment status remains `PAID` inserts another payment. An injury, phone, or name edit can therefore create a false charge and receipt.
4. New client and coach accounts receive predictable passwords, are not forced to change them, and the client/coach creation screens do not safely return those credentials.
5. Several visible controls only change local React state. Notifications, coach attendance, attendance reversal, attendance summary delivery, and parts of the command palette overstate what the system actually persists or can do.
6. Schedule CRUD, coach workflow writes, cash-out, reports, and password recovery remain absent from the live product even though parts of their backend already exist.
7. Booking, capacity, bulk session, and attendance rules are split between independent app-level calls and database functions, leaving race conditions and partial-commit paths.
8. Database errors are converted into plausible empty dashboards, so an outage can look like a quiet studio rather than a failure.

The remediation order in section 8 starts with the verification gate, function security/type correctness, financial integrity, and account onboarding before restoring larger workflow surfaces.

## 2. Scope and evidence

### 2.1 Surfaces inspected

- Every current admin route: overview, attendance, clients, schedule, subscriptions, join requests, groups, coaches, reports, notifications, and settings.
- Every current coach route: overview, sessions, clients, schedule, and alerts.
- Login, logout, role redirects, parked client routes, not-found behavior, receipt/file/cron API behavior, mobile drawer, and command palette.
- All files under `app/actions`, current dashboard workspaces, repositories, auth services, API routes, migrations, configuration, and tests.
- The linked Supabase migration ledger, live row inventory, function definitions, grants, database lint, and performance advisors using read-only queries.

### 2.2 Verification evidence at audit time

- `npm run typecheck`: passed.
- `npm run test:run`: 31 files and 341 tests passed.
- `npm run build`: passed on Next.js 16.2.10.
- `npx playwright test --workers=1 --reporter=line`: 6 of 6 shallow auth smoke tests passed.
- `npm audit --omit=dev`: 0 production dependency vulnerabilities.
- `npm run verify`: failed because ESLint scans generated JavaScript inside the archived design handoff.
- Browser: all 11 admin routes and all 5 coach routes rendered without a page error after a stable navigation wait.
- Browser: admin-to-coach, coach-to-admin, and anonymous protected-route guards redirected correctly.
- Responsive checks at 375, 768, 1024, and 1440 pixels found no document-level horizontal overflow on the sampled core routes.
- Linked migration ledger: aligned through `20260718120000`; local migration `20260718130000_restrict_trigger_function_execute.sql` is not hosted.
- Linked database lint reports two errors: `admin_save_client` and `promote_lead_to_client` compare text IDs with UUID values.
- Live data inventory: 22 users, 6 coaches, 14 clients, 20 subscriptions, 7 leads, 5 groups, 9 sessions, 5 notifications, 0 automation runs, and 1 settings row.
- No synthetic remote mutations were used during this audit.

### 2.3 Verification limits

- The only coach test account has no assigned group, session, or client. Coach write paths cannot be demonstrated end-to-end with that account.
- Destructive or synthetic hosted-data tests were not performed. Transactional/database invariants were assessed from current definitions, tests, lint, and read-only queries.
- The intermittent `/admin/groups` first-load error from the original audit has not recurred outside a self-inflicted build/dev-server collision, so its original cause remains unproven.

## 3. Original audit resolution matrix

| Audit item | Current status | Evidence |
|---|---|---|
| 1.1 settings upsert-on-read | Resolved | Repository now selects and only inserts when missing. |
| 1.2 client CRUD | Resolved | Functional client workspace is live with create/edit/delete/search/filter/pagination. |
| 1.3 fake change requests | Resolved as scoped | Fake panel and controls were removed because no persistence model exists. |
| 1.4 fake week arrows | Resolved | Offset is represented in the URL and the server refetches the requested window. |
| 1.5 schedule/session CRUD | Open | Live schedule remains read-only; the old CRUD workspace is still orphaned and is not safe to wire unchanged. |
| 1.6 intermittent groups error | Inconclusive | Not reproducible under repeated stable navigation. |
| 2.1 coach writes | Open | Live coach pages remain read-only/local-only. |
| 2.2 coach management | Resolved | Admin coach command center is live. |
| 2.3 group management | Resolved, with invariant gaps | CRUD and membership UI is live; capacity constraints are not enforced. |
| 2.4 cash-out | Open | Command only navigates to subscriptions; the orphaned dialog is explicitly local-only. |
| 2.5 client details | Resolved for intended scope | Live workspace provides the functional editor and payment history rather than the thin name-addressed drawer. |
| 2.6 client roster tools | Resolved | Search, filters, sorting, and pagination are live. |
| 2.7 password reset | Open | Backend methods exist but no request/reset delivery flow is reachable. |
| 2.8 reports | Open | Four static operational tiles only; no time series, breakdown, range, or export. |
| 2.9 client communication | Open | WhatsApp deep links remain the only client-facing channel. |
| 3.1 trial pipelines | Open | Lead stage and client lifecycle remain separate sources of truth. |
| 3.2 trial subscription mismatch | Open | Two trial clients are paid and have expired plus active subscription history. |
| 3.3 week-start/settings consumption | Open | Schedule is hard-coded Saturday-first; operational settings are stored but not consumed. |
| 3.4 recurring weekday mismatch | Open | All active templates say Sunday while linked occurrences exist on Saturday, Monday, and Tuesday. |
| 3.5 stale revalidation | Resolved | Removed paths were replaced with current route targets and covered by a contract test. |
| 3.6 duplicate demo generations | Open | `@test.com` and `@marvelfitness.demo` generations coexist. |
| 3.7 coach alert naming | Open | Coach alerts render the generic notification taxonomy, not injuries and changes. |
| 4.1 trigger-helper grants | Half done | Correct migration exists locally; hosted grants remain open. |
| 4.2 service-role/RLS model | Accepted architecture risk | Default-deny RLS is intentional, but it magnifies the importance of server-only boundaries and function grants. |
| 5.1 silent fallback | Open | All read failures still become fallback/empty data without a visible unavailable state. |
| 5.2 hourly automation | Open | Hosted `AutomationRun` count remains zero. |
| 6 stale/broken tests | Resolved, gate still red | The named tests now pass, but `npm run verify` fails on archived generated JavaScript. |
| 7.1 pluralization | Resolved | Current singular/plural labels are corrected. |
| 7.2 accessible names | Partially resolved | Most live controls now have names, but custom interactive rows/dialogs still need keyboard/focus work. |
| 7.3 placeholder coach | Resolved | `Coach User` is excluded from the admin grid. |
| 7.4 login default/copy | Open | Client ID/phone remains the default for an admin/coach operations tool. |
| 7.5 duplicate settings form | Resolved | A stable post-navigation DOM contains one form; earlier duplicate observations were streaming/stale snapshots. |
| 7.6 settings truth/validation | Open | Operational settings do not affect operations; copy implies that they do. |
| 7.7 empty coach demo | Open | Coach test account has no scoped data. |
| 7.8 command palette promises | Open | Cash-out is absent and people/actions are hard-coded. |
| 7.9 root/public presence | Product decision required | Root intentionally redirects to login and no public funnel is live. |
| 7.10 mobile behavior | Partially resolved | Drawer and overflow were manually checked; automated coverage remains shallow. |
| 8 performance | Open | Missing foreign-key indexes and `VerificationToken` primary key remain. |
| 9 hygiene | Partially resolved | Design artifacts and Prisma remnants were archived/removed, but orphaned code and misleading type homes remain. |

## 4. Critical and high-severity findings

### C-01: Hosted trigger-helper functions retain public execution

**Where:** `supabase/migrations/20260718130000_restrict_trigger_function_execute.sql` and hosted function grants.  
**Evidence:** `anon`, `authenticated`, and `service_role` currently all have execute privilege on `create_payment_ledger_entry()` and `log_training_session_change()`. The hosted migration ledger stops one migration earlier.  
**Impact:** Anyone holding the public anon key can invoke definer-privileged trigger helpers directly.  
**Root cause:** PostgreSQL grants function execution to `PUBLIC` by default, and the original trigger-helper migrations did not revoke it. The corrective migration was committed but never applied.

### C-02: Live client-edit and lead-promotion RPCs have text/UUID type drift

**Where:** Hosted `admin_save_client(jsonb)` and `promote_lead_to_client(uuid,text,text)`; migrations `20260715130000_add_client_lifecycle_and_trial_outcomes.sql` and `20260718120000_lead_trial_workflow.sql`.  
**Evidence:** Linked `supabase db lint` reports SQLSTATE 42883 for both functions. The live function definitions compare text primary-key columns to UUID expressions/arguments.  
**Impact:** Editing an existing client and converting a lead can fail at runtime. Create-client can still appear healthy because it follows a different branch.  
**Root cause:** An earlier dynamic compatibility migration patched stored definitions, but later feature migrations recreated both functions from their older UUID-based source. Migration history is technically aligned while function semantics regressed.

### C-03: Ordinary paid-client edits create duplicate financial records

**Where:** `admin_save_client(jsonb)` and `saveAdminClient`.  
**Evidence:** The editor preloads the current `PAID` status and amount. The RPC inserts a new `Payment` whenever the submitted status equals `PAID`, without checking whether the payment state changed or whether the request is an explicit payment operation.  
**Impact:** Editing a name, injury, phone, group, or other profile field can produce a false payment and receipt. Revenue, history, and reconciliation become incorrect.  
**Root cause:** Client profile mutation and payment recording were combined in one RPC; payment status was treated as an event rather than current state.

### C-04: New account credentials are predictable, undisclosed, and not forced to rotate

**Where:** `app/actions/admin-clients.ts`, `app/actions/admin-coaches.ts`, `admin_save_client`, and `save_coach`.  
**Evidence:** Client passwords are `MFS_<seven-digit client ID>`; coach passwords are `MFS_<email-localpart>2026`. New client rows explicitly set `mustChangePassword=false`; coach creation does not set it true. The create screens do not safely display a one-time credential result. The hosted database currently has zero users with `mustChangePassword=true`.  
**Impact:** Accounts can remain indefinitely on guessable passwords, while administrators may not even know what credential to deliver.  
**Root cause:** Demo credential generation was reused as production onboarding and the RPC return contracts only return record IDs/void.

### C-05: Coach command palette exposes clients outside coach scope

**Where:** `components/dashboard/dashboard-command-palette.tsx`.  
**Evidence:** Coach people results hard-code Omar Tarek, Sara Nabil, and Ali Hassan for every coach, including the unassigned test coach. Admin people and coach lists are hard-coded too.  
**Impact:** Coach users can see names and membership details unrelated to their assignments. It is also stale and can route to a page without selecting the named person.  
**Root cause:** Prototype data was left inside the shared live shell instead of receiving role-scoped repository data.

### C-06: Multiple controls visually claim persistence without a persisted operation

**Where:** notifications, coach overview/phone views, and attendance workspace.  
**Evidence:**

- Notification `Open` and `Mark all read` only update local `readIds`; the guarded `markNotificationRead` action is unused.
- Coach `Mark attendance` / `Attendance ready` only toggles local state.
- Attendance `Send summary to coach` only changes button text.
- Clicking an already attended row visually changes it to booked, then refuses to persist that reversal.
- `Late` is stored as `ATTENDED` and exists only as a local label.

**Impact:** Staff can believe a record, notification, or communication changed when refresh proves otherwise.  
**Root cause:** Design-prototype interaction state remained after the data-backed redesign. Missing domain states/actions were hidden behind optimistic UI rather than removed or implemented.

### H-01: Schedule and recurring-session management remain incomplete

**Where:** live schedule page, orphaned `admin-schedule-workspace.tsx`, session/recurring actions.  
**Evidence:** The live schedule can browse weeks and open attendance but cannot create, edit, cancel, delete, book, or manage templates. The old workspace has unsafe/stale behavior: it links to a removed template route, omits `groupId`, exposes direct status change to `CANCELED`, and lacks recurring-template edit/delete.  
**Impact:** Core daily operations require database/manual work or cannot be done.  
**Root cause:** The visual redesign replaced the functional route before the workflow was fully ported; the orphan cannot be rewired unchanged.

### H-02: Session and booking invariants are not transactional

**Where:** `session-booking-service.ts`, session actions, and training-session database functions.  
**Evidence:**

- A private booking cancels the existing booking before creating/reactivating the replacement; failure in the second call leaves the first client canceled.
- Capacity and duplicate checks occur in app code, leaving concurrent booking races.
- Waitlist settings exist but full sessions always throw instead of waitlisting.
- Direct session status update can set `CANCELED` without canceling bookings; only the separate cancellation function cascades.
- Bulk cancellation can cancel completed sessions while single cancellation refuses.
- Bulk coach reassignment checks target-coach conflicts outside the selection but not overlaps among selected sessions.
- Coach/session overlap prevention is not enforced by a database constraint or single locked transaction.

**Impact:** Double booking, over-capacity rosters, partial replacement, and inconsistent canceled/completed state are possible.  
**Root cause:** Business rules are divided between several app queries and RPCs with different semantics.

### H-03: Group capacity is informational only

**Where:** `saveAdminGroup` and `setAdminGroupMembership`.  
**Evidence:** Membership add does not lock/check group capacity; group edit can lower capacity below current membership.  
**Impact:** The roster can exceed displayed capacity or become invalid after an edit.  
**Root cause:** CRUD was restored without a database-side membership invariant.

### H-04: Coach operational backend is orphaned from the live UI

**Where:** all coach pages and actions for notes, bookings, assets, and settings.  
**Evidence:** Live coach components import none of the guarded write actions. Their visible attendance controls are local-only.  
**Impact:** Coaches cannot perform the responsibilities advertised by the product.  
**Root cause:** The Marvel Ops coach redesign ported display data but not the existing workflow components/actions.

### H-05: Authentication recovery and environment-secret handling are incomplete

**Where:** `auth.config.ts`, `auth-security-service.ts`, login, and ID/password auth service.  
**Evidence:**

- A known literal auth secret is used whenever `NODE_ENV` is not production, including preview/staging unless explicitly configured.
- Reset methods exist but no request/reset pages or delivery mechanism call them.
- Reset tokens are stored in plaintext rather than storing a digest.
- Login accepts only phone-like characters in its client-ID tab, while existing seed client IDs use an `MFS-` prefix and new IDs are seven digits.
- Rate-limit errors collapse into the same generic invalid-credentials response, so users receive no retry guidance.
- Client ID/phone is the default tab even though the delivered product is an admin/coach operations tool and the client portal is parked.

**Impact:** Preview security can be weak, client seed credentials are unusable in the UI, recovery is unavailable, and throttled users cannot distinguish cooldown from a bad password.  
**Root cause:** Several generations of authentication and demo onboarding coexist without a single delivered account lifecycle.

### H-06: Database failure is rendered as believable empty business data

**Where:** `withSupabaseFallback` and every read repository.  
**Evidence:** Any Supabase exception returns an empty/demo fallback with only a server console warning.  
**Impact:** An outage or broken query can show zero clients, zero sessions, or “all caught up,” encouraging incorrect operational decisions.  
**Root cause:** Render-safety fallback values do not carry a degraded/unavailable signal to the page.

### H-07: Hosted automation has no successful execution evidence

**Where:** Vercel cron, `/api/cron/studio-automation`, and `AutomationRun`.  
**Evidence:** The hosted table contains zero runs despite hourly configuration. Notifications belong only to demo-generation accounts, not the current test admin/coach.  
**Impact:** Renewal/session notification behavior is not operating or proven in the deployed environment.  
**Root cause:** Deployment/secret/cron activation was never completed or verified end-to-end.

## 5. Functional, data, and reliability findings

### F-01: Lead board refresh and source mapping can be stale or wrong

The active lead view does not consistently refresh received server props after create/assign/complete/promote, while server revalidation alone does not mutate the already rendered client tree. Unknown sources, including the admin-created default `Admin`, are labeled as WhatsApp by the view. Two live contacted/trial-done leads have no `trialGroupId`, contradicting the current staged workflow.

### F-02: Trial and subscription state have competing sources of truth

The lead pipeline, client lifecycle, subscription lifecycle, and payment status evolve independently. Two live trial clients are marked paid and have both expired and active subscription rows. The Today trial list and join-request board therefore describe different populations.

### F-03: Recurring template weekdays disagree with generated sessions

All five active templates have weekday `0` (Sunday under PostgreSQL/JavaScript conventions), but linked generated sessions exist on Saturday, Monday, and Tuesday in Cairo time. Settings claim a Monday start while the UI hard-codes Saturday-first. The system lacks a single weekday/time-zone contract.

### F-04: Operational settings are stored but not enforced

Schedule start day, default session length, booking buffer, intake limit, cancellation window, and waitlist size have no consumers in live scheduling/booking logic. “Changes apply to future operations” is currently false.

### F-05: Attendance bulk updates can partially commit

“Mark all in” issues separate server actions with `Promise.all`. If one call fails after others succeed, the UI can only tell the operator to refresh. The database function also always clears `canceledAt`; it accepts `CANCELED` from the action even though canceled bookings are rejected as source rows.

### F-06: Notification navigation is not constrained at the use site

Notification `href` values are generated internally today, but the client passes the database value directly to `router.push`. Persisted destinations should be validated against permitted internal routes before navigation.

### F-07: Cash-out is modeled as a prototype, not a ledger operation

The command palette navigates to subscriptions, the orphaned cash-out dialog stores local state only, and the existing billing adjustment requires a client. Studio expenses need their own persisted ledger/expense concept and receipt/audit semantics.

### F-08: File deletion removes metadata but can orphan storage objects

Client deletion removes `File` rows in the database but does not delete the corresponding Storage objects. Metadata disappears while paid storage and sensitive object remnants remain.

### F-09: API authentication errors become 500 responses

Anonymous receipt and file-download requests let `requireUser()` throw through the route, producing 500 instead of 401/403. The receipt route also dereferences `data.client` without handling a ledger row whose client relation is absent. File downloads use an encoded string in `filename=` rather than a robust `filename*=` value.

### F-10: Reports do not meet their own product claim

The “Live studio report” repeats four current stats with full-width progress bars. It has no date range, trends, revenue breakdown, attendance breakdown, coach utilization, export, or reconciliation view.

### F-11: Client communication is external and manual

No email/SMS/WhatsApp provider workflow records delivery to clients. Admin/coach notifications are internal rows; client communication is a manually opened `wa.me` link with no delivery audit.

### F-12: Repository reads and action ownership are inconsistent

Most pages use repositories, but the live admin clients page performs a direct service-role query for receipt-related data. Live domain types still reside in `lib/mocks`, obscuring which values are authoritative. The architecture is generally route -> workspace -> repository/action, but exceptions make security and failure behavior harder to audit.

## 6. Accessibility, UX, and content findings

### U-01: Custom dialogs lack complete modal behavior

Lead, schedule, subscription, coach, and command-palette overlays do not consistently provide Radix-level focus trapping, focus return, Escape behavior, and background inertness. Some rows use `article role="button"` instead of native buttons, increasing keyboard-state complexity.

### U-02: Command palette is stale and non-contextual

People and coaches are hard-coded. Admin person links use a legacy `?profile=<name>` contract the live client workspace does not consume. “Record cash out” promises an absent operation. “New member” and “Add lead” navigate to a page rather than opening the named action.

### U-03: Coach pages contain dishonest attendance labels

“Mark attendance” and “Attendance ready” suggest a saved roster action but only toggle local state. These controls must be connected to scoped booking/attendance mutations or removed.

### U-04: Login identity model is inconsistent

The default/client-first interface conflicts with the current staff-only deployment, and its phone input prevents entering prefixed seed IDs. Copy should describe the actual supported account types and route parked client users honestly.

### U-05: Settings feedback is incomplete

There is no field-level validation feedback for operational values, and saved fields that are ignored by business logic are presented as active configuration.

### U-06: Empty demo accounts prevent meaningful verification

The only coach test account has no assignments. Empty states render, but the core coach experience cannot be demonstrated or tested without changing live data.

### U-07: Public entry behavior needs an explicit product decision

The root route always redirects to login, the sitemap lists only login, and the prior join/marketing funnel is removed while dead join actions remain. This is acceptable for an internal tool only if explicitly documented as the intended product boundary.

## 7. Testing, performance, and repository findings

### T-01: The verification gate is red for archived generated code

ESLint scans `docs/archived/design-handoff/.../support.js`, reporting deprecated ReactDOM usage, CommonJS/module mutation, hook, expression, and unused-variable violations. The application source can be clean while `npm run verify` still fails. Archived third-party/generated artifacts should be excluded from application linting.

### T-02: Unit coverage is uneven and workflow coverage is shallow

Overall coverage is approximately 78% statements, 67% branches, 76% functions, and 80% lines. Command palette, authorization policy, auth service, notification service, and Supabase configuration/server paths are notably weak. The six E2E tests cover authentication smoke behavior, not CRUD, role-scoped writes, financial integrity, cancellation, booking, notifications, or failure states.

### T-03: Server actions and stored procedures lack integration contracts

Most action tests verify source strings or pure service behavior. They do not execute the current RPC definitions against a reset database, which is why later migrations could reintroduce text/UUID errors while the TypeScript suite remained green.

### P-01: Foreign-key indexes and a primary key are missing

Supabase performance advisors report roughly 23 foreign keys without covering indexes. `VerificationToken` has no primary key. At current demo scale this is not a latency problem, but joins, cascades, and token maintenance will degrade or become operationally awkward as data grows.

### P-02: Full-table reads and client-side filtering will not scale

Several repositories fetch full tables and filter/sort/page in application memory. This is acceptable for 14 clients but not for a growing studio. Pagination and filter semantics should move to database queries while keeping exact total counts.

### R-01: Orphaned live-domain code remains

Unused schedule, coach, cash-out, payments, billing, bulk-import, profile, recurring, booking, notification, landing, and parked-client/transformation actions/components remain mixed together. Parked client/transformation code must be preserved, but active-domain orphans should either be wired, explicitly parked, or removed after replacements are proven.

### R-02: Documentation and type ownership remain misleading

Some architecture guides predate the current Next.js/Marvel Ops structure, live types remain under `lib/mocks`, and the audit tracker contains stale rows contradicted by its own addendum. Current behavior needs one maintained source of truth.

### R-03: Supported runtime is not the system default

The package requires Node `>=22 <25`, but the machine default is Node 25.9. Verification must prepend/use the bundled Node 24.14 runtime; otherwise native dependencies and framework behavior can differ from CI.

## 8. Remediation order

1. Exclude archived generated artifacts from ESLint and restore `npm run verify` as a trustworthy gate.
2. Replace the broken client/lead RPC definitions with explicit text-ID functions, fix payment-event semantics, add database-level regression tests, and apply the pending trigger-function revoke migration.
3. Replace predictable onboarding passwords with random one-time credentials, require rotation, and return/display credentials once through guarded admin workflows.
4. Return correct 401/403/404 API responses and harden receipt/file edge cases.
5. Remove hard-coded command-palette people and pass role-scoped live command data; remove unsupported cash-out action until persistence exists.
6. Make notification read state persistent and remove/implement every local-only attendance/summary control.
7. Restore schedule CRUD with one consistent cancellation path, group linkage, booking management, recurring-template edit/delete, and configured week semantics.
8. Move booking, private replacement, capacity, waitlist, group membership, overlap, bulk cancel, and attendance-bulk invariants into transactional database functions.
9. Restore coach notes, attendance, bookings, assets, and settings using existing guarded actions and strictly coach-scoped queries.
10. Implement a real studio cash-out/expense ledger and useful time-ranged operational reports.
11. Implement secure password reset/onboarding delivery and remove non-production fallback secrets outside explicit local development.
12. Surface degraded database state, deploy/verify cron automation, and reconcile notification recipients/demo identities.
13. Reconcile lead/client/subscription trial state, recurring weekdays, time zone, and operational settings consumption.
14. Complete accessibility/focus/keyboard work, field validation, truthful copy, and automated responsive workflows.
15. Add missing indexes/primary key, move pagination to queries, consolidate domain types, and classify remaining parked/orphaned code.

## 9. Completion standard

This remediation is complete only when:

- Every open item above is resolved, deliberately removed, or recorded as an explicit product decision with no misleading UI.
- Every changed/new server action retains `requireRole` or `requireUser`; coach and client queries remain ownership-scoped.
- Hosted migration state matches local migration state and database lint/security advisors have no applicable errors or public definer-function warnings.
- Financial edits cannot create unintended payments; booking/capacity/cancellation operations are atomic under concurrency.
- Every visible action either persists successfully, navigates to a real destination, or is absent/disabled with truthful explanation.
- `npm run verify`, production dependency audit, database checks, and expanded browser tests pass on supported Node 24.
- Admin and coach workflows are tested with representative scoped data, including mobile, keyboard, failure, and refresh persistence checks.
- This document is updated with commit IDs, migration evidence, commands, and any remaining external deployment actions.
