-- Receipts are persisted as rendered strings so they can be shared later
-- (email, WhatsApp, public links) without re-deriving them from ledger data.
create table "Receipt" (
  "id" uuid primary key default gen_random_uuid(),
  "billingLedgerEntryId" uuid unique references "BillingLedgerEntry"("id") on delete set null,
  "receiptNumber" text not null unique,
  "clientId" text references "Client"("id") on delete set null,
  "content" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index "Receipt_client_idx" on "Receipt" ("clientId", "createdAt" desc);

create trigger "Receipt_set_updated_at"
before update on "Receipt"
for each row execute function public.set_updated_at();

alter table "Receipt" enable row level security;
revoke all on table "Receipt" from anon, authenticated;
grant all on table "Receipt" to service_role;
