# Current Product Scope - Marvels Fit Studios

## 1. Product Context & Objectives
Marvels Fit Studios is an operational management system designed for studio Administrators and Coaches to manage client memberships, training groups, schedules, session attendance, leads, billing, and studio operations. Clients do not access the web portal directly; all client records and session workflows are managed by staff (Admins and Coaches).

---

## 2. Feature Classification Matrix

### A. Current & Required Features (In-Scope)
- **Authentication & Security**:
  - Staff (Admin, Coach) login with email & password.
  - Custom JWT session management.
  - Password change, forced password reset, and issue/consume grant workflow.
  - Security event logging (`SecurityEvent`), auth throttling (`AuthThrottle`), rate limiting (`RateLimitBucket`).
- **Client Management**:
  - Client profile directory with 6 primary database enum statuses (`ACTIVE`, `PENDING`, `PAUSED`, `TRIAL`, `INACTIVE`, `DID_NOT_CONTINUE`).
  - Coach assignment & group assignment.
  - Private coach notes & rehabilitation flags (`WorkoutNote`).
- **Lead Intake & Conversion**:
  - Public lead capture and trial request intake (`Lead`).
  - Admin lead promotion to full Client profile (`promote_lead_to_client`).
- **Subscription & Billing**:
  - Subscriptions (`ClientSubscription`) tied to plans (`SubscriptionPlan`).
  - Support for session-count plans and monthly membership cycles.
  - Payment tracking (`Payment`), financial ledger entries (`BillingLedgerEntry`), and automated 1:1 receipt generation (`Receipt`).
- **Scheduling & Roster Management**:
  - Recurring weekly session templates (`RecurringSessionTemplate`) and slots (`RecurringSessionSlot`).
  - Master schedule training sessions (`TrainingSession`) across group and private formats.
  - Session roster attendance bookings (`SessionBooking`) with statuses `BOOKED`, `ATTENDED`, `MISSED`, `LATE`, `EXCUSED`, `CANCELED`, `WAITLISTED`.
  - Strict Client Daily Session Limit: Maximum of 1 active or completed training session per client per Cairo calendar day (`Africa/Cairo`).
  - Strict Coach Non-Overlap: Prevention of overlapping sessions for the same coach at the same time.
- **Studio Operations & Reporting**:
  - Operational studio expenses (`StudioExpense`) and revenue ledger (`StudioIncome`).
  - Global studio settings (`StudioSettings`).
  - System notifications (`Notification`) and scheduled automation job logs (`AutomationRun`).

### B. Legacy Features (Removed from Scope)
- **Workout & Transformation Tracking**:
  - Independent client workout program builder (`TrainingProgram`, `ProgramWorkout`, `WorkoutExercise`).
  - Individual set/rep workout logging (`WorkoutLog`, `WorkoutSetLog`).
  - Client physical assessments & goals (`ClientAssessment`, `ClientGoal`, `ClientCheckIn`).
  - Biometric progress metric logs (`ProgressMetric`).
  - *Rationale*: Client portal access is excluded in current product scope; workout set logging is unreferenced in all current Admin and Coach workflows.

### C. Excluded & Future Concepts
- **Direct Client Portal Login**: Clients do not log in or manage subscriptions self-serve.
- **Third-Party Payment Gateway Webhooks**: Payment processing is managed manually by studio admins via cash or transfer records.

---

## 3. Scope Sign-Off & Architectural Boundaries
All database schemas, API routes, server actions, UI components, seed scripts, and verification test suites are strictly aligned with this product scope document. Obsolete vertical slices outside this scope are systematically purged.
