create type "LedgerEntryType" as enum ('PAYMENT', 'CHARGE', 'CREDIT', 'REFUND');
create type "LedgerEntryStatus" as enum ('POSTED', 'VOID');

create table "BillingLedgerEntry" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete restrict,
  "clientSubscriptionId" text references "ClientSubscription"("id") on delete set null,
  "paymentId" text unique references "Payment"("id") on delete restrict,
  "type" "LedgerEntryType" not null,
  "status" "LedgerEntryStatus" not null default 'POSTED',
  "amount" numeric(12, 2) not null check ("amount" > 0),
  "currency" text not null default 'EGP',
  "description" text not null,
  "receiptNumber" text not null unique,
  "occurredAt" timestamptz not null default now(),
  "createdById" text references "User"("id") on delete set null,
  "createdAt" timestamptz not null default now()
);

create index "BillingLedgerEntry_client_occurred_idx"
  on "BillingLedgerEntry" ("clientId", "occurredAt" desc);
create index "BillingLedgerEntry_subscription_idx"
  on "BillingLedgerEntry" ("clientSubscriptionId", "occurredAt" desc);

alter table "BillingLedgerEntry" enable row level security;
revoke all on table "BillingLedgerEntry" from anon, authenticated;
grant all on table "BillingLedgerEntry" to service_role;

create or replace function public.create_payment_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."BillingLedgerEntry" (
    "clientId", "clientSubscriptionId", "paymentId", "type", "amount", "currency",
    "description", "receiptNumber", "occurredAt"
  ) values (
    new."clientId", new."clientSubscriptionId", new."id", 'PAYMENT', new."amount", new."currency",
    coalesce(nullif(trim(new."note"), ''), 'Membership payment'),
    'MFS-' || to_char(new."date", 'YYYYMM') || '-' || upper(left(replace(new."id", '-', ''), 10)),
    new."date"
  ) on conflict ("paymentId") do nothing;
  return new;
end;
$$;

create trigger "Payment_create_ledger_entry"
after insert on "Payment"
for each row execute function public.create_payment_ledger_entry();

insert into "BillingLedgerEntry" (
  "clientId", "clientSubscriptionId", "paymentId", "type", "amount", "currency",
  "description", "receiptNumber", "occurredAt"
)
select
  payment."clientId", payment."clientSubscriptionId", payment."id", 'PAYMENT', payment."amount",
  payment."currency", coalesce(nullif(trim(payment."note"), ''), 'Membership payment'),
  'MFS-' || to_char(payment."date", 'YYYYMM') || '-' || upper(left(replace(payment."id", '-', ''), 10)),
  payment."date"
from "Payment" payment
on conflict ("paymentId") do nothing;

create or replace function public.record_ledger_adjustment(
  p_client_id text,
  p_subscription_id text,
  p_type public."LedgerEntryType",
  p_amount numeric,
  p_currency text,
  p_description text,
  p_created_by_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare entry_id uuid := gen_random_uuid();
begin
  if p_type not in ('CHARGE', 'CREDIT', 'REFUND') then
    raise exception 'Only charge, credit, or refund adjustments are allowed.' using errcode = '22023';
  end if;
  if p_amount <= 0 then raise exception 'Amount must be positive.' using errcode = '22023'; end if;
  insert into public."BillingLedgerEntry" (
    "id", "clientId", "clientSubscriptionId", "type", "amount", "currency",
    "description", "receiptNumber", "createdById"
  ) values (
    entry_id, p_client_id, nullif(p_subscription_id, ''), p_type, p_amount,
    upper(coalesce(nullif(trim(p_currency), ''), 'EGP')), trim(p_description),
    'MFS-' || to_char(now(), 'YYYYMM') || '-' || upper(left(replace(entry_id::text, '-', ''), 10)),
    p_created_by_id
  );
  return entry_id;
end;
$$;

revoke all on function public.record_ledger_adjustment(text, text, public."LedgerEntryType", numeric, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_ledger_adjustment(text, text, public."LedgerEntryType", numeric, text, text, text)
  to service_role;
