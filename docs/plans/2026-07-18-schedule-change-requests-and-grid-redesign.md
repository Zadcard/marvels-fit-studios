# Schedule change requests + grid redesign

**Date:** 2026-07-18
**Context:** The Scribble design handoff (`docs/archived/design-handoff/Marvel Ops.html`) shows a Schedule page with a compact time×day grid and a "Change requests" approve/decline panel. The live `/admin/schedule` page uses a different day-column calendar and has no change-request concept — the design's panel was in fact the exact fake, local-state-only feature a prior audit (finding 1.3) found and removed. This design restores it for real, on top of the current transactional booking primitives, and reworks the calendar to match the mockup's grid layout.

## 1. Data model

New table `ScheduleChangeRequest`:

```sql
create table "ScheduleChangeRequest" (
  id uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"(id),
  kind text not null check (kind in ('CANCEL_OCCURRENCE','MOVE_OCCURRENCE','RECURRING_WEEKDAYS')),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','DECLINED')),
  reason text not null,
  "sourceSessionId" text references "TrainingSession"(id),
  "targetSessionId" text references "TrainingSession"(id),
  "groupId" text references "Group"(id),
  "fromWeekdays" int[],
  "toWeekdays" int[],
  "effectiveFrom" date,
  "resultSummary" text,
  "createdById" text not null references "User"(id),
  "createdAt" timestamptz not null default now(),
  "decidedById" text references "User"(id),
  "decidedAt" timestamptz
);
```

Field usage by `kind`: `CANCEL_OCCURRENCE` uses `sourceSessionId`; `MOVE_OCCURRENCE` uses `sourceSessionId`+`targetSessionId`; `RECURRING_WEEKDAYS` uses `groupId`, `fromWeekdays`/`toWeekdays` (0-6, Cairo-local, same convention as `RecurringSessionTemplate.weekday`), `effectiveFrom`. Required-field validation happens in the RPC, not as a DB constraint.

## 2. Approval logic (RPCs, admin-only)

`log_schedule_change_request(...)` validates kind-specific fields and inserts a `PENDING` row. No schedule side effects.

`decide_schedule_change_request(request_id, decision)`:
- `DECLINED`: status update only.
- `APPROVED`, dispatched by kind:
  - **CANCEL_OCCURRENCE**: cancels the client's booking at `sourceSessionId`; a missing/already-canceled booking is a no-op, not an error.
  - **MOVE_OCCURRENCE**: cancels the source booking, books the target via the existing `book_client_into_session` capacity/waitlist path. Strict — if the target booking fails, the whole approval rolls back and the error surfaces to the admin.
  - **RECURRING_WEEKDAYS**: loops future (`startsAt > now()`, `DRAFT`/`SCHEDULED`) occurrences in the group from `effectiveFrom`. Cancels bookings on `fromWeekdays` occurrences; attempts bookings on `toWeekdays` occurrences. Best-effort — per-occurrence capacity failures are caught and appended to `resultSummary` instead of aborting the loop; the request is still marked `APPROVED`.

All three reuse existing booking/cancellation primitives rather than duplicating capacity/transactional logic.

## 3. UI

**Logging**: from the session roster in the existing inspector, each booked client gets a "Log change request" action. Opens a Radix dialog pre-filled with client+session; staff picks kind, reason (required), and kind-specific fields (target session for Move; from/to weekdays + effective date for Recurring, defaulted from the client's current bookings in that group).

**Reviewing**: a "Change requests" card in the same position as the mockup (right column), listing only `PENDING` requests — avatar/name, reason, kind badge, plain-English change description, Approve/Decline. Approving a recurring request surfaces `resultSummary` in an inline notice. Decided requests drop out of the panel (no history view — DB rows remain for later audit if ever needed).

## 4. Calendar grid redesign

Rows become the sorted set of *distinct start-times actually occurring in the visible week* (data-driven, so it degrades gracefully instead of assuming a fixed slot grid). Columns are the 7 days from the configured week-start. A cell stacks multiple blocks if sessions share an exact time. Blocks keep the mockup's colored-left-border card style, colored per coach from a fixed palette.

Structural deviation from the mockup: it has no separate "selected session" panel (only grid + change-requests). To preserve editing/cancellation/roster management without competing for the same column, **clicking a block opens session details in a dialog** (reusing the existing session-editor dialog styling) instead of a permanent side panel.

Filter bar, "New session," "Recurring series," and week navigation stay functionally unchanged, restyled to the mockup's tokens.

## Status

Design validated with user 2026-07-18. Proceeding directly to implementation (no separate plan-writing pass — single continuous session).
