# Security & Row Level Security (RLS) Test Matrix - Marvels Fit Studios

## 1. Executive Summary
Row Level Security (RLS) policies were systematically tested across all 31 active tables in the PostgreSQL schema for 5 distinct role contexts:
1. `Admin` (Lead / Ops Staff)
2. `Coach A` (Assigned Coach)
3. `Coach B` (Unassigned Cross-Coach)
4. `Client Identity` (UserRole.CLIENT, password = null)
5. `Anonymous` (Unauthenticated Guest)

---

## 2. RLS Evaluation Matrix across Schema Tables

| Table Name | SELECT (Admin) | SELECT (Coach A) | SELECT (Coach B) | SELECT (Client) | SELECT (Anon) | INSERT (Admin) | INSERT (Coach A) | INSERT (Coach B) | UPDATE (Coach A / B) | DELETE (Coach A / B) | Final RLS Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `User` | Allow | Self / Staff | Self / Staff | Deny | Deny | Allow | Deny | Deny | Self Only | Deny | **Verified** |
| `Coach` | Allow | Allow | Allow | Deny | Deny | Allow | Deny | Deny | Self Only | Deny | **Verified** |
| `Client` | Allow | Assigned | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `Lead` | Allow | Deny | Deny | Deny | Public Intake | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `ClientSubscription` | Allow | Assigned | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `SubscriptionPlan` | Allow | Allow | Allow | Deny | Public Catalog | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `Payment` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `Receipt` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `BillingLedgerEntry` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `StudioExpense` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `StudioIncome` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `TrainingSession` | Allow | Assigned | Assigned | Deny | Deny | Allow | Assigned | Deny | Assigned Only | Deny | **Verified** |
| `SessionBooking` | Allow | Assigned | Deny | Deny | Deny | Allow | Assigned | Deny | Assigned Only | Deny | **Verified** |
| `Group` | Allow | Assigned | Allow | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `TrainingCategory` | Allow | Allow | Allow | Deny | Public Catalog | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `CategorySupervisor` | Allow | Allow | Allow | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `CoachTrainingCategory`| Allow | Allow | Allow | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `RecurringSessionTemplate`| Allow | Assigned | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `RecurringSessionSlot`| Allow | Assigned | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `ScheduleChangeLog` | Allow | Assigned | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `ScheduleChangeRequest`| Allow | Assigned | Deny | Deny | Deny | Allow | Assigned | Deny | Deny | Deny | **Verified** |
| `StudioSettings` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `PasswordResetGrant` | Allow | Deny | Deny | Deny | Public Token | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `AuthThrottle` | System | System | System | System | System | System | System | System | System | System | **Verified** |
| `SecurityEvent` | Allow | Deny | Deny | Deny | Deny | Allow | Deny | Deny | Deny | Deny | **Verified** |
| `RateLimitBucket` | System | System | System | System | System | System | System | System | System | System | **Verified** |
| `Notification` | Allow | Self | Self | Deny | Deny | Allow | System | System | Self Only | Deny | **Verified** |
| `File` | Allow | Assigned | Deny | Deny | Deny | Allow | Assigned | Deny | Deny | Deny | **Verified** |
| `SessionNote` | Allow | Assigned | Deny | Deny | Deny | Allow | Assigned | Deny | Assigned Only | Deny | **Verified** |
| `ClientCoachNote` | Allow | Author | Deny | Deny | Deny | Allow | Author | Deny | Author Only | Deny | **Verified** |
| `AutomationRun` | System | System | System | System | System | System | System | System | System | System | **Verified** |

---

## 3. Cross-Coach Security Isolation Audit
- **Test Case 1**: Coach A attempts to fetch Coach B's private notes (`ClientCoachNote`). **RESULT: DENIED by RLS policy `ClientCoachNote_staff_all`**.
- **Test Case 2**: Coach A attempts to modify Coach B's training session. **RESULT: DENIED by server action `requireCoachClientAccess` and database check**.
- **Test Case 3**: Coach A attempts to access `/admin/reports` or `/admin/settings`. **RESULT: DENIED by middleware policy `requireRole(UserRole.ADMIN)`**.
- **Test Case 4**: Client identity attempts credential sign-in. **RESULT: DENIED by `CredentialsAuthService.authorize`**.
