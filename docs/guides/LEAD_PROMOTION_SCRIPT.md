# Lead Promotion Script

## Goal

Convert existing `Lead` records into real login-capable `User` and `Client` records without doing row-by-row manual work in Prisma Studio.

## What was added

### 1. Promotion service

Created:

- `lib/leads/promote-leads-to-clients.ts`

This service:

- loads selected leads
- skips leads that cannot become login accounts
- creates or reuses a `User`
- creates a linked `Client` if missing
- marks the lead as `CONVERTED`

### 2. CLI script

Created:

- `scripts/promote-leads-to-clients.ts`

This script supports:

- `--all`
- `--email <address>`
- `--limit <n>`
- `--dry-run`

### 3. npm command

Added:

- `npm run promote:leads`

## Safety rules implemented

The promotion skips a lead when:

- the lead has no email
- the lead has no password hash
- the email belongs to an existing non-client user without a client profile

This avoids accidentally turning an admin or coach account into a client account.

## Commands

Preview all pending leads:

```bash
npm run promote:leads -- --all --dry-run
```

Promote all pending leads:

```bash
npm run promote:leads -- --all
```

Promote one specific lead:

```bash
npm run promote:leads -- --email user@example.com
```

Limit batch size:

```bash
npm run promote:leads -- --all --limit 10
```

## Outcome of each promotion

For each promoted lead, the script:

1. ensures a `User` exists
2. ensures `User.role = CLIENT`
3. ensures a linked `Client` profile exists
4. marks the lead status as `CONVERTED`

## Why this is the right next step

The current registration flow writes to `Lead`, while credentials login reads from `User`.

That means lead capture and login are separate today. This script closes that gap quickly without requiring a new admin UI first.
