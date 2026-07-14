# Join Request Flow Revamp

**Date:** 2026-07-15
**Status:** Draft — pending additional changes from owner (see "Incoming changes" at the bottom)
**Scope:** The public join-request submission flow and the admin approve/decline workflow.

---

## 1. Current flow (as-is)

### Submission (public)

Two entry points post to the same server action:

- Landing page modal — `components/landing/join-now-form.tsx`
- Standalone page `/join` — `app/join/join-form.tsx`

Both call `submitJoinNowLead` in `app/actions/landing.ts`, which:

1. Validates **name + phone** only (Zod, `lib/validators/id-auth.ts`).
2. Reserves the next client ID (`reserveNextClientId`) by scanning all pending
   leads' `message` fields for `__join_credentials__:<id>` sentinels and taking
   `max + 1` on top of `clientIdGenerator.getNextAvailableSlot()`.
3. Derives a temporary password from the ID (`MFS_<clientId>` via
   `lib/services/password-generator.ts`), bcrypt-hashes it.
4. Rejects the submission if the phone already belongs to a `Client` or a
   pending `Lead`.
5. Inserts a `Lead` row (`status = NEW`,
   `message = "__join_credentials__:<id>"`, `source = "landing-join-now"`).
6. **Immediately shows the visitor their Client ID and temporary password** —
   even though no `User` row exists yet, so those credentials do not work
   until an admin approves.

### Decision (admin)

- Page: `app/(dashboard)/admin/join-requests/page.tsx` →
  `components/dashboard/admin-leads-workspace.tsx`.
- Data: `lib/repositories/admin-lead-repository.ts` pulls the whole `Lead`
  table (excluding `CONTACTED`), filters/searches/sorts in JS.
- **Approve** → `approveLeadAsClient` (`app/actions/admin-leads.ts`) →
  `promoteLeadsToClients` (`lib/leads/promote-leads-to-clients.ts`) → Postgres
  RPC `promote_lead_to_client`
  (`supabase/migrations/20260714001200_lead_promotion_function.sql`). The RPC
  creates/updates the `User` + `Client`, sets `mustChangePassword = true`, and
  flips the lead to `CONVERTED`. Credentials are re-shown to the admin.
- **Decline** → `deleteLead`: a hard `DELETE` of the row. No status, no
  reason, no audit trail.

---

## 2. Problems identified (worst first)

| # | Severity | Problem |
|---|----------|---------|
| P1 | **Critical — security** | Temporary passwords are guessable: `MFS_<clientId>` where client IDs are sequential (`YYMM` + 3 digits). Anyone can enumerate IDs and log in as any client who hasn't changed their password. Because `mustChangePassword` runs *after* auth, the attacker is the one who sets the new password. |
| P2 | High — data integrity | There is no real "decline". Rejecting deletes the row: no reason, no audit, and the person can immediately re-submit (duplicate check only looks at `NEW`/`CONTACTED`). `LeadStatus.CLOSED` exists in the enum and is unused. |
| P3 | High — UX/security | Credentials are issued **before** approval. The visitor walks away with an ID/password that silently don't work; there's no "pending review" state, so failed logins look like a generic credentials error. |
| P4 | High — live bug | Admin only ever sees 5 leads: `admin-lead-repository.ts` does `filtered.slice(0, 5)` while reporting counts from the full set. Header says "40 requests", pagination paginates over 5 rows, requests 6+ are invisible. |
| P5 | Medium — correctness | Client-ID reservation races: two concurrent submissions read the same `max`. No unique constraint on `Lead.phone` or the reserved ID (only unique index is on `email`, which is always null on this path). |
| P6 | Medium — data modeling | `Lead.message` is abused as a metadata column (`__join_credentials__:` sentinel). The admin "Message" column always reads "No message submitted." and applicants can't say why they're joining. |
| P7 | Medium — ops | No delivery or notification: no email/SMS provider is installed. Admins must hand-copy credentials; nothing alerts them when a request arrives. |
| P8 | Medium — abuse | The public action has no rate limit, captcha, or bot check. Spam floods the lead table and burns the 999-per-month client-ID sequence. |
| P9 | Low — UX debt | One-at-a-time approval (even though `promoteLeadsToClients` accepts arrays); a single `isPending` disables every row's buttons and shows "Approving…" on all of them; `/admin/leads` and `/admin/join-requests` are two surfaces over the same data. |

---

## 3. Target flow (to-be)

**Principle: credentials are issued at approval, not at submission. The lead is a first-class request with a full lifecycle.**

### Submission

- Visitor submits name + phone (+ optional real message, see P6).
- They see a **status screen, not credentials**: "Request received — we'll
  call you on +20…", optionally with a short reference code.
- No client ID is reserved, no password generated. Nothing to leak.

### Approval

- Client ID is allocated **inside the approval RPC** using a Postgres
  sequence per `YYMM`. `reserveNextClientId` and its race are deleted —
  the admin is the only writer.
- Password becomes either:
  - **(a)** a random 12+ character string shown once to the admin, or
  - **(b)** (preferred) a single-use **setup token/link** the admin sends by
    WhatsApp, letting the client set their own password.
  - Either way, `MFS_<clientId>` derivation is removed.

### Decline

- Decline sets `status = CLOSED` with `declineReason`, `decidedBy`,
  `decidedAt`. A **Reopen** action reverses it.
- Hard delete remains as a separate, explicit "purge spam" action.

### Schema changes

- `Lead` gains: `reservedClientId` (nullable, unique), `notes`,
  `declineReason`, `decidedAt`, `decidedBy`.
- Drop the `__join_credentials__:` sentinel; `message` returns to being the
  applicant's actual message.
- Unique constraint on pending `Lead.phone` (partial index).

### Rejected alternative

Keeping credentials-at-submission by creating the `User` immediately in a
`PENDING` state (login shows "your request is under review"). Rejected:
more auth-guard surface, unapproved rows in the user table. For a gym where
an admin phones every lead anyway, approval-first is simpler and safer.

---

## 4. Implementation plan (ordered)

| Step | Work | Type | Size |
|------|------|------|------|
| 1 | Fix the `slice(0, 5)` truncation; push search/sort/pagination into the Supabase query (`admin-lead-repository.ts`). | Bug fix | S |
| 2 | Replace derived `MFS_<id>` password with a cryptographically random one. | Security | S |
| 3 | Stop showing credentials at submission; show a pending-status screen instead (both join forms + `submitJoinNowLead`). | Security + UX | M |
| 4 | Add `CLOSED`-based decline with reason + audit fields; keep delete as a separate "purge" action. Requires migration. | Feature | M |
| 5 | Move client-ID allocation into the approval RPC via a Postgres sequence; add unique constraints; delete `reserveNextClientId`. | Correctness | M |
| 6 | Rate-limit / bot-protect the public submission action. | Abuse | S–M |
| 7 | Bulk approve/decline; per-row pending state; unify `/admin/leads` and `/admin/join-requests` into one surface. | UX | M |
| 8 | Notification on approval (WhatsApp deep-link is cheapest — no email provider is wired up) + admin badge/count for waiting requests. | Feature | M |

Steps 1–3 are the bug-and-security cluster and need no schema migration; they should land first.

---

## 5. Key files

| Area | File |
|------|------|
| Public submit action | `app/actions/landing.ts` |
| Join forms | `components/landing/join-now-form.tsx`, `app/join/join-form.tsx` |
| Credentials screen | `components/join-credentials-screen.tsx` |
| Admin page | `app/(dashboard)/admin/join-requests/page.tsx` |
| Admin workspace UI | `components/dashboard/admin-leads-workspace.tsx` |
| Admin actions | `app/actions/admin-leads.ts` |
| Lead repository | `lib/repositories/admin-lead-repository.ts` |
| Promotion logic | `lib/leads/promote-leads-to-clients.ts` |
| Promotion RPC | `supabase/migrations/20260714001200_lead_promotion_function.sql` |
| Credential sentinel | `lib/leads/lead-credential-metadata.ts` |
| Password generator | `lib/services/password-generator.ts` |
| Lead store | `lib/leads/landing-lead-store.ts` |

---

## 6. Incoming changes (to be added by owner)

> Placeholder — additional changes will be appended here as they are
> communicated. Each entry should note what it changes, which step(s) above
> it affects, and any new steps it introduces.

- **2026-07-15 — Notifications enhancement plan.** Step 8's "admin
  notification on new join request" is now specified as idea N6 in
  [2026-07-15-notifications-enhancement.md](./2026-07-15-notifications-enhancement.md),
  which also covers the unread badge, bulk mark-read, and additional
  automated event sources. The delivery-channel decision (N11 there) and
  step 8 here should share one provider choice.
