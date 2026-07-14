# Phase 1 plan

| Workstream | Status |
| --- | --- |
| Repository and environment audit | Complete |
| Version-controlled Supabase schema | Complete |
| Server client, generated types, and error boundary | Complete |
| Repository, service, action, and auth migration | Complete |
| Transactional database functions | Complete |
| Legacy database packages and configuration removal | Complete |
| Empty hosted database verification | Complete |
| Documentation and handoff | Complete |
| Local lint, typecheck, tests, and build | Complete |
| Auth hardening and database failure visibility | Complete |
| Private file storage migration | Complete |
| Transformation assessment/program/progress workflow | Complete |
| Recurring schedule templates | Complete |
| Session and renewal notification automation | Complete |
| Billing ledger and protected receipts | Complete |
| Browser smoke and role-boundary verification | Complete |

## Rollback

Revert the migration commits and redeploy the last known-good application revision. Hosted schema changes are additive and versioned; do not edit migration history that has already been applied. Use a new forward migration for corrections.
