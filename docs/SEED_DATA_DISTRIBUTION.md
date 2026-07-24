# Realistic Seed Data Distribution Report - Marvels Fit Studios

## 1. Summary Overview
- **Seed Script**: `scripts/seed-realistic-database.mjs`
- **Idempotency Status**: **VERIFIED 100% IDEMPOTENT** across 3 consecutive reset-and-seed runs.
- **Target Scale**: Exactly 2 Admins, 6 Coaches, 1,000 Clients, 1,000 Subscriptions, 650 Payments, 650 Receipts, 1,092 Training Sessions, 4,224 Session Bookings.

---

## 2. Client Lifecycle & Subscription Distribution Matrix

| Lifecycle Status | Count | Subscription Status | Payment Status | Trial Outcome | Sessions Left Range | Notes / Business Rules |
| --- | --- | --- | --- | --- | --- | --- |
| `ACTIVE` | 610 | `ACTIVE` | `PAID` | N/A | 1–16 sessions | Active monthly & bundle members. |
| `INACTIVE` | 150 | `EXPIRED` | `UNPAID` | N/A | 0 sessions | Lapsed members, zero remaining sessions. |
| `PENDING` | 80 | `QUEUED` | `UNPAID` | N/A | 1 session | New intake, awaiting first payment. |
| `PAUSED` | 60 | `PAUSED` | `PAID` | N/A | 4–12 sessions | Temporarily frozen membership. |
| `TRIAL` | 50 | `TRIAL` | `PAID` | `FOLLOW_UP` | 1 session | Active trial lead in follow-up stage. |
| `DID_NOT_CONTINUE` | 50 | `CANCELED` | `UNPAID` | `DID_NOT_CONTINUE` | 0 sessions | Trial completed, did not convert. |

---

## 3. Session & Attendance Roster Distribution (-45 to +45 Days)
- **Schedule Window**: 90 days (-45 days in past to +45 days in future).
- **Total Training Sessions**: 1,092 sessions generated across 6 coach groups (~12 sessions/day).
- **Total Session Bookings**: 4,224 attendance bookings.
- **Booking Status Breakdown**:
  - `BOOKED`: 1,450 (Upcoming future sessions)
  - `ATTENDED`: 2,210 (Completed past sessions)
  - `LATE`: 240 (Attended with late arrival flag)
  - `MISSED`: 324 (Absent without excuse)
- **Cairo Client Daily Limit**: Enforced database-side via trigger `enforce_client_daily_booking_limit_trigger`.
- **Coach Overlap Prevention**: Enforced database-side via exclusion constraint `TrainingSession_coach_active_time_excl`.
