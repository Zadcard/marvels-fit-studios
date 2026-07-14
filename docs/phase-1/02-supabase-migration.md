# Supabase migration

## Final architecture

The Next.js server calls one service-role Supabase client from `lib/supabase/server.ts`. Repositories and services return typed application records. Atomic workflows are implemented as service-role-only SQL functions. Auth.js remains the identity and session layer.

## Reproducible schema

Run `npm run supabase:migrations` to compare local and linked history. Migrations through `20260714002200` define the application schema, transformation domain, security audit/throttling records, private Storage metadata, recurring schedule templates, notifications, automation runs, and billing ledger. Regenerate types with `npm run supabase:types` after every schema change.

## Fresh-start decision

No legacy records were imported. The destination was deliberately verified empty so the team can begin with a clean dataset. `supabase/seed.sql` contains no application fixtures.

## Security model

- RLS is enabled on application tables.
- Browser roles cannot execute server workflow functions.
- The service-role key stays in server environment variables only.
- Database functions set `search_path = ''` and schema-qualify referenced objects.

## Validation

Migration history is aligned through `20260714002200`. Schema lint, generated types, transformation lifecycle checks, recurrence idempotency, notification deduplication, receipt creation, and application checks are recorded in `07-verification-report.md`.

## Workflow functions

- `check_auth_throttle`, `record_auth_attempt`, and `record_security_event` protect and audit credential sign-in.
- `save_training_program` and `record_workout_performance` keep transformation writes atomic.
- `generate_recurring_sessions` converts weekly local times in the template timezone and prevents duplicate occurrences.
- `enqueue_studio_notifications` creates deduplicated 24-hour session and 7-day renewal reminders.
- `record_ledger_adjustment` records admin charges, credits, and refunds; a payment trigger automatically creates payment receipts.

## Storage

Coach files are stored in the private `coach-files` Supabase Storage bucket. Database rows retain metadata and authorization scope only. Downloads pass through an authenticated server route; the bucket is not public.
