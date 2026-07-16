# Marvel Fit Studios — operations refocus

Refocusing the product from a generic multi-portal gym app into a focused
internal operations system for **admins and coaches** (single studio, 6th of
October City). Client accounts, workout-plan building, accounting, and
notifications are **not** first-launch goals.

## Decisions (2026-07-15)

- Start with domain correctness, then scope containment, then the client
  lifecycle, then Today/attendance. (Roadmap order in the audit.)
- Out-of-scope subsystems are **parked safely, data preserved** — never dropped:
  client portal, transformation studio (assessments/goals/programs), billing
  ledger + receipts, notification automation/cron.
- Training categories: Football, Tennis, Other sport, Fat loss, Muscle gain,
  Calisthenics, Rehab, General fitness.

## Key mismatches found

1. No `trainingCategory`/sport and no first-class injury data on `Client` — the
   studio's core matching + safety axes were missing. **(fixed in Phase 1)**
2. Full client portal exists but is out of scope for launch.
3. Transformation studio, billing ledger, notification cron inflate scope.
4. No trial-outcome model or Marvel client lifecycle.
5. No schedule-change / coach double-booking model.
6. `Today` is not yet the operational hub; nav lacks Today and Groups.

## Phase 1 — DONE: training category + first-class injuries (additive)

Non-destructive foundation so category + injury are real, filterable, visible.

- **Migration** `supabase/migrations/20260715120000_add_client_training_category_and_injuries.sql`:
  new enums `TrainingCategory`, `InjuryStatus`; `Client` columns
  `trainingCategory` (default `GENERAL_FITNESS`), `sport`, `injuryStatus`
  (default `NONE`), `injuryNotes`, `restrictions`; indexes on category + injury
  status; `admin_save_client` reads the new fields non-destructively.
- **Types/labels**: `lib/supabase/database.types.ts`, `lib/supabase/domain.ts`,
  new `lib/dashboard/client-domain-labels.ts` (+ test).
- **Read path**: `admin-client-repository(.ts/-helpers.ts)`,
  `admin-dashboard-data.ts` (new record fields + `adminTrainingCategoryFilters`).
- **Write path**: `app/actions/admin-clients.ts` (label→enum, payload fields).
- **UI**: `components/dashboard/admin-clients-workspace.tsx` — Training filter,
  category + injury-alert on cards, injury/restrictions dossier section, and
  editor fields.

Verified: `npm run typecheck`, targeted lint, and `npm run test:run`
(320 passed). Injury alert shows for `CURRENT`/`REHAB` only.

> Apply step (requires DB): `npm run supabase:reset` (local) then
> `npm run supabase:types`, or apply the migration to the dev project before
> deploy. Until applied, the roster read falls back to empty because the new
> `select` columns won't exist.

## Phase 2 — DONE: scope containment (park out-of-scope, keep data)

Central `lib/launch-scope.ts` (flags `LAUNCH_CLIENT_PORTAL_ENABLED`,
`LAUNCH_NOTIFICATIONS_ENABLED`, `LAUNCH_TRANSFORMATION_ENABLED`, all `false`).
`proxy.ts` redirects parked routes (client portal → `/portal-unavailable`,
notifications/transformation → role home). Notification bell + coach
transformation links hidden. No tables/data dropped; flip a flag to re-enable.
Tests in `lib/launch-scope.test.ts`. New page `app/portal-unavailable`.

## Phase 3 — DONE: client lifecycle + trial outcomes (additive)

Migration `20260715130000_add_client_lifecycle_and_trial_outcomes.sql`: lifecycle
statuses gain TRIAL / INACTIVE / DID_NOT_CONTINUE; new `TrialOutcome` enum +
`Client.trialOutcome`. Labels centralised in `client-domain-labels.ts`; threaded
through domain, read (repository/helpers), write (`admin-clients` action +
`admin_save_client`), and the admin clients UI (status filter, trial-outcome
editor field + dossier line).

## Phase 4 — DONE (core): Today = Needs Attention panel

`lib/dashboard/needs-attention.ts` (pure, tested) + `getNeedsAttention()` on the
overview repository surface injury alerts today, expired/expiring subscriptions,
and trials-to-follow-up as action-linked tiles on `/admin`. Fixed the stale
parked `/admin/notifications` link. Full attendance-marking UX rework (fast
today's-roster marking) is NOT yet done — the existing `/admin/sessions`
attendance flow remains.

## Phase 9 — DONE (core): coach injury/category visibility

`CoachClientRecord` + coach repository now carry trainingCategory + injury
status/notes/restrictions; the coach clients workspace shows an injury alert
badge on rows/cards and an injury & restrictions strip in the client detail.
The coach **sessions** roster (`coach-session-data` + repository +
`coach-sessions-workspace`) also shows an inline injury/restrictions alert per
participant — so a coach sees restrictions on the session roster before it runs.

## Verification status

All work: `npm run typecheck`, `npm run test:run` (342 passing), and a full
`npm run build` green. **Not verified against a live database/browser** — DB
migrations are version-controlled but require `supabase db reset` / apply to a
project before the new columns/behaviour render (reads fall back to empty until
applied). Phases 6/7/8 especially need a live click-through:
- Phase 6: create/edit a group, add/remove members on `/admin/groups`.
- Phase 7: renew a subscription on `/admin/subscriptions`, confirm the prior
  period is preserved as history and the list shows the new period.
- Phase 8: try to create two overlapping sessions for one coach; the second
  must be blocked with the conflict message.

Migrations added this effort: `20260715120000`, `20260715130000`,
`20260716090000`, `20260716100000`.

## Roadmap phase status (all code-verified via typecheck + tests + build)

- **Phase 5 (scheduling/recurring):** DONE (code). Training category, injury
  alert counts, and trial counts now surface on the admin weekly schedule
  (agenda rows + session inspector) via `admin-schedule-repository` +
  `admin-schedule-data` + `admin-schedule-workspace`, and injury alerts on the
  coach session roster. Recurring generation already existed. Category/injury/
  trial marks now also render directly on the calendar blocks.
- **Phase 6 (groups/private):** DONE (code, not live-verified). New
  `/admin/groups` page + `admin-groups-workspace` (create/edit/delete a group,
  assign coach + training category + capacity + active + notes, add/remove
  members, recurring-schedule summary from templates). Migration
  `20260716100000_add_group_operational_fields.sql` adds
  `Group.trainingCategory/capacity/isActive/notes`. Repository
  `admin-group-repository`, action `admin-groups`, nav entry "Groups".
- **Phase 8 (schedule changes):** DONE (code). Tested
  `lib/services/schedule-conflicts.ts` wired into **both** `createTrainingSession`
  and `updateTrainingSession`, so a coach double-booking is blocked on create and
  on reschedule (studio-space clashes remain allowed, per the brief). Schedule
  change **history** is preserved by a DB trigger
  (`20260716110000_schedule_change_log.sql` → `ScheduleChangeLog`) capturing
  reschedules, cancellations, and coach reassignments from any path. The change
  log now surfaces in the schedule session inspector ("Recent changes").
  Remaining: a dedicated single-session-vs-recurring change *UI* and the change
  log on the client profile.
- **Phase 10 (UI consistency):** owned by the in-progress REDLINE rebuild.
  This effort kept terminology/status labels consistent and removed dead parked
  links; new surfaces (Groups, Needs Attention, schedule flags) use the same
  tokens. Deep visual polish continues there.
- **Phase 11 (analytics):** intentionally deferred. The brief lists analytics as
  optional and warns against non-actionable stat dashboards; the actionable
  signal (Needs Attention) is delivered in Phase 4, which is the right scope.
- **Phase 7 (subscriptions renew-history):** DONE (code, not live-verified).
  Migration `20260716090000_subscription_renewal_history.sql` drops the
  `ClientSubscription_clientId_planId_key` unique index and rewrites the `renew`
  branch of `admin_mutate_subscription` to close the current period
  (status EXPIRED, endsAt now) and INSERT a new ACTIVE period, linking the
  renewal Payment to the new period. `admin-subscription-repository` now dedups
  to the latest period per (clientId, planId) for the operational table, so the
  list stays clean while full history lives in the DB.
  `admin_save_subscription` uses plain insert/update (no ON CONFLICT), so
  dropping the index is safe. Needs a live renew on `/admin/subscriptions` to
  confirm end-to-end.
## Coach specialties — DONE (code)

Migration `20260716120000_add_sport_coach_specializations.sql` extends
`CoachSpecialization` with sport/goal values (Football, Tennis, Calisthenics,
Rehab, Athletic Performance, General Fitness) additively — existing modality
values stay valid. Threaded through `domain.ts`, `database.types.ts`, the coach
repositories, `admin-coaches` action, and the coach editor's specialty options.

## Fast attendance — DONE (code)

New `/admin/attendance` page (`admin-attendance-repository` +
`admin-attendance-workspace`, nav "Attendance") lists today's sessions in order
with one-tap Attended / Absent / No-show / Rescheduled / Cancelled per attendee,
and flags injuries + trials inline. Migration
`20260716130000_add_attendance_states.sql` adds `NO_SHOW` + `RESCHEDULED` to
`BookingStatus`; validator, `markAttendance` action, and attendance service were
widened accordingly (narrow status annotations across session repositories were
widened to the `BookingStatus` domain type).

## Single-vs-recurring change — DONE (code)

The recurring-template infrastructure already existed
(`/admin/schedule/templates` + create/generate/activate actions). The schedule
session inspector now exposes `sourceTemplateId` and, for a session in a series,
states explicitly that editing/cancelling there affects **this session only**,
with a link to change the whole recurring series via its template.

## Remaining (small polish, non-blocking)

- Surface the `ScheduleChangeLog` on the client profile (already on the schedule
  inspector).
- Optional: an in-place "edit the series from this date" flow embedded in the
  schedule (today it routes to the templates page).

Migrations added across this effort: `20260715120000`, `20260715130000`,
`20260716090000`, `20260716100000`, `20260716110000`, `20260716120000`,
`20260716130000`.
