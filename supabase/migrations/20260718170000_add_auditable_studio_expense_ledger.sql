create type public."StudioExpenseCategory" as enum (
  'SUPPLIES', 'MAINTENANCE', 'COACH_PAYMENT', 'RENT_UTILITIES', 'MARKETING', 'OTHER'
);
create type public."StudioExpenseMethod" as enum (
  'CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY'
);
create type public."StudioExpenseStatus" as enum ('POSTED', 'VOID');

create table public."StudioExpense" (
  "id" uuid primary key default gen_random_uuid(),
  "expenseNumber" text not null unique,
  "amount" numeric(12, 2) not null check ("amount" > 0),
  "currency" text not null default 'EGP' check (char_length("currency") = 3),
  "category" public."StudioExpenseCategory" not null,
  "paymentMethod" public."StudioExpenseMethod" not null,
  "description" text not null check (char_length(trim("description")) between 2 and 300),
  "reference" text check ("reference" is null or char_length("reference") <= 120),
  "status" public."StudioExpenseStatus" not null default 'POSTED',
  "occurredAt" timestamptz not null,
  "createdById" text not null references public."User"("id") on delete restrict,
  "createdAt" timestamptz not null default now(),
  "voidedById" text references public."User"("id") on delete restrict,
  "voidedAt" timestamptz,
  "voidReason" text,
  constraint "StudioExpense_void_audit_check" check (
    ("status" = 'POSTED' and "voidedById" is null and "voidedAt" is null and "voidReason" is null)
    or
    ("status" = 'VOID' and "voidedById" is not null and "voidedAt" is not null and char_length(trim("voidReason")) between 2 and 300)
  )
);

create index "StudioExpense_occurred_idx"
  on public."StudioExpense" ("occurredAt" desc);
create index "StudioExpense_category_occurred_idx"
  on public."StudioExpense" ("category", "occurredAt" desc);
create index "StudioExpense_created_by_idx"
  on public."StudioExpense" ("createdById");
create index "StudioExpense_voided_by_idx"
  on public."StudioExpense" ("voidedById") where "voidedById" is not null;

alter table public."StudioExpense" enable row level security;
revoke all on table public."StudioExpense" from anon, authenticated;
grant all on table public."StudioExpense" to service_role;

create or replace function public.record_studio_expense(
  p_amount numeric,
  p_currency text,
  p_category public."StudioExpenseCategory",
  p_payment_method public."StudioExpenseMethod",
  p_description text,
  p_reference text,
  p_occurred_at timestamptz,
  p_created_by_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_id uuid := gen_random_uuid();
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Expense amount must be positive.' using errcode = '22023';
  end if;
  if nullif(trim(p_description), '') is null or char_length(trim(p_description)) > 300 then
    raise exception 'Expense description must be 2 to 300 characters.' using errcode = '22023';
  end if;
  if char_length(trim(p_description)) < 2 then
    raise exception 'Expense description must be 2 to 300 characters.' using errcode = '22023';
  end if;
  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then
    raise exception 'Expense date cannot be in the future.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public."User" studio_user
    where studio_user."id" = p_created_by_id and studio_user."role" = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;

  insert into public."StudioExpense" (
    "id", "expenseNumber", "amount", "currency", "category", "paymentMethod",
    "description", "reference", "occurredAt", "createdById"
  ) values (
    entry_id,
    'MFS-OUT-' || to_char(coalesce(p_occurred_at, now()), 'YYYYMM') || '-' || upper(left(replace(entry_id::text, '-', ''), 10)),
    p_amount,
    upper(coalesce(nullif(trim(p_currency), ''), 'EGP')),
    p_category,
    p_payment_method,
    trim(p_description),
    nullif(trim(p_reference), ''),
    p_occurred_at,
    p_created_by_id
  );
  return entry_id;
end;
$$;

create or replace function public.void_studio_expense(
  p_expense_id uuid,
  p_voided_by_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public."StudioExpenseStatus";
begin
  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) not between 2 and 300 then
    raise exception 'Void reason must be 2 to 300 characters.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public."User" studio_user
    where studio_user."id" = p_voided_by_id and studio_user."role" = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;

  select expense."status" into current_status
  from public."StudioExpense" expense
  where expense."id" = p_expense_id
  for update;
  if not found then
    raise exception 'Expense record not found.' using errcode = 'P0002';
  end if;
  if current_status = 'VOID' then
    raise exception 'Expense is already void.' using errcode = '22023';
  end if;

  update public."StudioExpense"
  set "status" = 'VOID',
      "voidedById" = p_voided_by_id,
      "voidedAt" = now(),
      "voidReason" = trim(p_reason)
  where "id" = p_expense_id;
end;
$$;

revoke all on function public.record_studio_expense(
  numeric, text, public."StudioExpenseCategory", public."StudioExpenseMethod",
  text, text, timestamptz, text
) from public, anon, authenticated;
revoke all on function public.void_studio_expense(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.record_studio_expense(
  numeric, text, public."StudioExpenseCategory", public."StudioExpenseMethod",
  text, text, timestamptz, text
) to service_role;
grant execute on function public.void_studio_expense(uuid, text, text)
  to service_role;
