# Analytics Event Catalog

Canonical machine-readable source: `lib/analytics/event-catalog.json`

## Audit findings

- No shared analytics helper, event catalog, or validation layer existed in application code.
- No product analytics events were previously instrumented across `app`, `components`, `lib`, or `scripts`.
- The highest-impact gap was the landing membership funnel, which had no visibility into modal opens or form outcomes.
- This patch instruments only the landing join funnel to keep the change small and safe while establishing a stable schema.

## Assumptions

- Events must not include direct identifiers such as name, phone, email, or password.
- Client-side analytics should degrade safely when no vendor SDK is present.
- `window.dataLayer` is the integration seam for any downstream analytics platform added later.

## Current tracked events

| Event | Trigger | Properties |
| --- | --- | --- |
| `landing_join_modal_opened` | A landing CTA opens the membership modal | `trigger_source` |
| `landing_join_form_submit_attempted` | The membership form is submitted | `form_id`, `lead_source` |
| `landing_join_form_submit_succeeded` | The membership form succeeds | `form_id`, `lead_source` |
| `landing_join_form_submit_failed` | The membership form fails | `form_id`, `lead_source`, `failure_reason`, `field_error_count` |

## Known remaining gaps

- Login attempts and outcomes are still untracked.
- Dashboard workflows are still untracked.
- There is no server-side event delivery or warehouse export yet.
