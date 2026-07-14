# Next Steps To Reach 100% Backend Completion

This file lists the remaining backend work after the 2026-04-09 session.

It is not a “90% plan.”
It is the more complete list of what still remains to call the backend truly finished.

## Current Estimate

Current backend state:

- approximately `85% to 90%`

To reach a real `100%`, the project still needs the following.

## 1. End-To-End Verification Across All Roles

This is still the biggest unfinished block.

Every critical cross-role flow should be tested and hardened:

- admin creates session
- admin edits session
- admin cancels session
- admin deletes session
- admin assigns coach
- admin assigns client
- admin unassigns client
- admin reassigns private-session client
- coach sees assigned sessions
- coach assigns/unassigns clients to owned sessions
- coach marks attendance
- client sees assigned sessions
- client sees assigned coach
- client sees subscription changes
- admin edits subscription amount/status
- client sees updated subscription state

Remaining work:

- run these systematically
- document observed failures
- patch every failing edge case
- verify after refresh and after role switching

## 2. Subscription And Billing Completion

Subscriptions improved a lot today, but they are not fully complete yet.

Still needed:

- explicit subscription cancel flow
- explicit subscription pause/resume flow with validated business rules
- explicit renew flow
- safer handling when changing plan on an existing subscription
- clearer distinction between:
  - plan default price
  - subscription custom price
  - payment history
- better revenue logic:
  - current revenue is based on payments, which is okay, but reporting logic should be intentionally defined
- payment history view per subscription/client
- admin ability to inspect payment history, not just current status
- optional refund/adjustment model if needed by the product

## 3. Eliminate Remaining legacy ORM Runtime Workarounds

Right now, some features rely on SQL because legacy ORM runtime stale-model issues appeared after schema changes.

Known/current workaround areas:

- `StudioSettings`
- `ClientSubscription.customPrice`
- coach specialization
- client status
- any other recently added schema fields that were patched with SQL

To fully finish backend quality:

- identify every SQL workaround
- verify generated legacy ORM client and runtime alignment
- replace SQL with clean legacy ORM reads/writes where stable
- keep only intentional SQL where it truly adds value

This is a maintainability milestone, not just a bug fix milestone.

## 4. Admin Client Backend Completion

Client CRUD is much better, but still not fully finished as a polished backend domain.

Still needed:

- verify create/edit/delete flows against all related data
- make sure delete rules are complete for all client-owned relations
- confirm group assignment behavior is real and safe
- confirm subscription assignment is consistent from both admin clients and admin subscriptions surfaces
- confirm client status, payment status, and subscription state do not conflict semantically
- optional:
  - add typed delete confirmation UX parity where needed across remaining destructive operations

## 5. Admin Coach Backend Completion

Coach editing and deletion exist, but a fully complete backend still needs:

- verify coach delete behavior against:
  - assigned sessions
  - assigned groups
  - clients indirectly attached through groups
- confirm coach creation/login/auth lifecycle is complete and not only dev-friendly
- add or finalize true coach onboarding/account bootstrap if required by the product

## 6. Account Lifecycle Completion

The app still needs a more complete account backend to truly reach 100%.

Still needed:

- coach account onboarding flow
- client account onboarding/activation flow if required
- password reset flow
- optional password change flow inside dashboard settings
- stronger admin account management flow
- production-safe secrets and auth hardening review

## 7. Session Domain Completion

Sessions are strong now, but still need final hardening:

- verify delete/cancel semantics on all dependent client/coach views
- verify behavior for completed sessions
- verify private session replacement rules in every entry point
- verify capacity behavior for group sessions under all edit/reassign cases
- confirm canceled sessions are fully hidden or labeled consistently where appropriate
- verify admin schedule and admin sessions stay perfectly in sync
- verify coach schedule and coach sessions stay perfectly in sync

## 8. Coach Portal Completion

Coach side is much better, but 100% completion still requires:

- full verification of `/coach`
- full verification of `/coach/sessions`
- full verification of `/coach/schedule`
- full verification of `/coach/clients`
- confirm attendance updates reflect correctly everywhere
- confirm assignment/unassignment permissions are strict to owned sessions only
- confirm coach settings and coach profile data are consistent across all coach surfaces

## 9. Client Portal Completion

Client side improved a lot today, but 100% means:

- verify `/client`
- verify `/client/sessions`
- verify `/client/coach`
- verify `/client/subscription`
- verify `/client/settings`
- confirm no stale amount/coach/session state after admin edits
- confirm client portal always resolves to the correct client-specific rows even after multi-user edits
- confirm there are no remaining fallback behaviors that hide broken linkage

## 10. Admin Overview And Reporting Truthfulness

Still needed:

- verify `/admin` overview counts and recent activity against real DB state
- verify subscription and payment stats are intentional and not just “whatever can be aggregated”
- verify schedule/session stats after create/edit/cancel/delete
- verify client and coach counts after CRUD changes

## 11. Settings And Profile Completion

Settings are better now, but full completion still needs:

- confirm admin settings are consumed by business logic where appropriate, not only stored
- confirm client settings are respected where product expects them
- confirm coach settings are consistent across coach/admin-facing views
- optional:
  - make all settings/profile pages fully schema-driven and remove placeholder preference-only fields if they are not meant to persist

## 12. Data Consistency And Cleanup Pass

Still needed:

- inspect current DB for duplicates or stale rows created during iterative debugging
- clean duplicate payments where they exist beyond current guarded flows
- verify seed data still works with latest schema
- verify no orphaned client subscriptions, bookings, or notes exist
- review data migrations or seed strategy for stable dev bootstrap

## 13. Backend Error Handling Standardization

Current behavior is functional, but not fully standardized.

Still needed:

- consistent server action error messages
- consistent validation style across domains
- decide whether to standardize on:
  - thrown `Error`
  - structured action results
  - domain-specific error helpers
- remove remaining silent failures or UI-only fallback messages where real backend errors should surface

## 14. Automated Test Coverage

This is one of the biggest reasons the backend is not truly 100% yet.

Still needed:

- service-level tests for:
  - training session lifecycle
  - booking lifecycle
  - private session reassignment
  - attendance updates
  - subscription create/edit/payment update
  - client settings persistence
- repository-level smoke tests where practical
- auth/session tests for role routing
- cross-role happy-path tests if the repo supports them

Without this, the backend can be strong but still not truly “finished.”

## 15. Operational Readiness

Still needed:

- confirm `AUTH_SECRET` / auth secret setup is production-safe
- fix lint configuration if still broken
- verify full production build in a normal networked environment
- document required env vars clearly
- document seed/bootstrap expectations clearly

## Recommended Execution Order To Reach 100%

1. Run the full end-to-end verification sweep.
2. Fix every cross-role session/subscription bug found.
3. Stabilize client subscription truth and multi-user correctness.
4. Normalize legacy ORM/runtime mismatches and reduce SQL workaround surface.
5. Finish subscription/billing lifecycle operations.
6. Finish coach/client onboarding and account lifecycle operations.
7. Add automated test coverage for core flows.
8. Do final production-hardening pass.

## Definition Of 100% Backend Complete

The backend can be considered truly complete only when:

- all major admin/coach/client flows are DB-backed
- all major cross-role flows are verified end to end
- there are no known correctness bugs in session/subscription/client/coach domains
- runtime/schema mismatches are resolved or intentionally documented
- core flows have automated coverage
- production configuration is verified

Until then, the project is very strong, but not fully complete.
