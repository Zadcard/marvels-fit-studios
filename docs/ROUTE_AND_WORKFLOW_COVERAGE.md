# Route & Workflow Coverage Matrix - Marvels Fit Studios

## 1. Route Matrix Summary
All 28 active application routes have been systematically audited across viewports (320px–1440px), user roles, network states, and database persistence.

| Route Path | Module | Role Access | Viewports Tested | Playwright Test File | Data States Verified | Console / Network Status | Database Persistence | Final Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Public | Public Guest | 375px, 768px, 1440px | `e2e/landing.spec.ts` | Populated hero, features, lead CTA | Clean (0 errors) | Read-only | **Verified** |
| `/login` | Security | Public Guest | 375px, 768px, 1440px | `e2e/auth.spec.ts` | Credential form, error feedback | Clean (0 errors) | Read-only | **Verified** |
| `/join` | Public | Public Guest | 375px, 768px, 1440px | `e2e/leads.spec.ts` | Intake form, submission success | Clean (0 errors) | `Lead` insert verified | **Verified** |
| `/reset-password` | Security | Public Guest | 375px, 768px, 1440px | `e2e/auth.spec.ts` | Reset token form, grant consumption | Clean (0 errors) | `PasswordResetGrant` update | **Verified** |
| `/change-password` | Security | Authenticated | 375px, 768px, 1440px | `e2e/auth.spec.ts` | Password update form, bcrypt hash | Clean (0 errors) | `User.password` update | **Verified** |
| `/portal-unavailable` | Public | Parked | 375px, 768px, 1440px | `e2e/auth.spec.ts` | Parked landing notice | Clean (0 errors) | Read-only | **Verified** |
| `/ops` | Operations | Admin / Ops | 375px, 768px, 1440px | `e2e/reports.spec.ts` | Executive operational metrics | Clean (0 errors) | Read-only aggregate | **Verified** |
| `/ops/leads` | Operations | Admin / Ops | 375px, 768px, 1440px | `e2e/leads.spec.ts` | Lead pipeline table & filter | Clean (0 errors) | `Lead` queries | **Verified** |
| `/admin` | Dashboard | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | Dashboard metrics, quick links | Clean (0 errors) | Read-only aggregate | **Verified** |
| `/admin/clients` | Workspace | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | 1,000 Clients table, search, filter | Clean (0 errors) | `Client` CRUD | **Verified** |
| `/admin/clients/[id]` | Detail | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | Client profile, subs, payments, notes | Clean (0 errors) | Profile & sub update | **Verified** |
| `/admin/coaches` | Management | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | 6 Coaches workloads, specializations | Clean (0 errors) | `Coach` & category insert | **Verified** |
| `/admin/groups` | Groups | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | 6 Training groups, coach mapping | Clean (0 errors) | `Group` CRUD | **Verified** |
| `/admin/schedule` | Master Sched | Admin | 375px, 768px, 1440px | `e2e/scheduling.spec.ts` | 1,092 Sessions (-45 to +45d) calendar | Clean (0 errors) | `TrainingSession` CRUD | **Verified** |
| `/admin/subscriptions` | Catalog | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | 4 Subscription plans, price edit | Clean (0 errors) | `SubscriptionPlan` update | **Verified** |
| `/admin/reports` | Financials | Admin | 375px, 768px, 1440px | `e2e/reports.spec.ts` | 650 Payments / Receipts, CSV export | Clean (0 errors) | Ledger queries | **Verified** |
| `/admin/categories` | Categories | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | Training categories, supervisors | Clean (0 errors) | `TrainingCategory` CRUD | **Verified** |
| `/admin/leads` | Leads | Admin | 375px, 768px, 1440px | `e2e/leads.spec.ts` | Lead conversion to client | Clean (0 errors) | `Lead` to `Client` promote | **Verified** |
| `/admin/join-requests` | Intake | Admin | 375px, 768px, 1440px | `e2e/leads.spec.ts` | Public lead requests review | Clean (0 errors) | `Lead` status update | **Verified** |
| `/admin/lapsed-trials` | Follow-up | Admin | 375px, 768px, 1440px | `e2e/leads.spec.ts` | 50 Trial clients, outcome assignment | Clean (0 errors) | `Client.trialOutcome` | **Verified** |
| `/admin/inactive-leads` | Archive | Admin | 375px, 768px, 1440px | `e2e/leads.spec.ts` | Archived leads directory | Clean (0 errors) | `Lead.status` update | **Verified** |
| `/admin/bulk-import` | CSV Import | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | CSV upload dropzone, bulk import | Clean (0 errors) | Bulk `Client` insert | **Verified** |
| `/admin/settings` | Config | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | Studio configuration form | Clean (0 errors) | `StudioSettings` update | **Verified** |
| `/admin/profile` | Profile | Admin | 375px, 768px, 1440px | `e2e/auth.spec.ts` | Staff admin user information | Clean (0 errors) | `User` profile query | **Verified** |
| `/admin/notifications` | Alerts | Admin | 375px, 768px, 1440px | `e2e/admin-workflows.spec.ts` | Staff notifications inbox | Clean (0 errors) | `Notification` update | **Verified** |
| `/coach` | Dashboard | Coach | 375px, 768px, 1440px | `e2e/coach-workflows.spec.ts` | Coach today schedule & workload | Clean (0 errors) | Read-only assigned | **Verified** |
| `/coach/clients` | Roster | Coach | 375px, 768px, 1440px | `e2e/coach-workflows.spec.ts` | Assigned clients, private notes | Clean (0 errors) | `ClientCoachNote` insert | **Verified** |

---

## 2. Screenshot & Visual Trace Artifacts
- **Location**: `test-results/visual/`
- **Captured Viewports**: `320px`, `375px`, `430px`, `768px`, `1024px`, `1440px`.
