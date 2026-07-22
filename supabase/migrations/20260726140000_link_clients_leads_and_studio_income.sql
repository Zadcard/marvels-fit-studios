begin;

-- Clients and leads now point at the same first-class categories used by
-- Programs. Existing enum columns remain temporarily for compatibility, but
-- relational IDs are the source used by all new UI and workflow writes.
alter table public."Client" add column "categoryId" text;
alter table public."Lead" add column "categoryId" text;

update public."Client" client
set "categoryId" = studio_group."categoryId"
from public."Group" studio_group
where client."groupId" = studio_group.id;

update public."Client" client
set "categoryId" = category.id
from public."TrainingCategory" category
where client."categoryId" is null
  and category."legacyValue" = client."trainingCategory"::text;

update public."Lead" lead
set "categoryId" = studio_group."categoryId"
from public."Group" studio_group
where lead."trialGroupId" = studio_group.id;

update public."Lead" lead
set "categoryId" = category.id
from public."TrainingCategory" category
where lead."categoryId" is null
  and lead."interestedCategory" is not null
  and category."legacyValue" = lead."interestedCategory"::text;

alter table public."Client"
  add constraint "Client_categoryId_fkey"
    foreign key ("categoryId") references public."TrainingCategory"("id")
    on delete restrict on update cascade;
alter table public."Lead"
  add constraint "Lead_categoryId_fkey"
    foreign key ("categoryId") references public."TrainingCategory"("id")
    on delete restrict on update cascade;

create index "Client_categoryId_idx" on public."Client" ("categoryId");
create index "Lead_categoryId_idx" on public."Lead" ("categoryId");

create or replace function public.sync_client_category_from_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new."groupId" is not null then
    select studio_group."categoryId" into new."categoryId"
    from public."Group" studio_group
    where studio_group.id = new."groupId";
    if not found then
      raise exception 'Group record not found.' using errcode = 'P0002';
    end if;
  end if;
  return new;
end;
$$;

create trigger "Client_sync_category_from_group"
before insert or update of "groupId", "categoryId" on public."Client"
for each row execute function public.sync_client_category_from_group();

create or replace function public.sync_lead_category_from_trial_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  group_category_id text;
begin
  if new."trialGroupId" is not null then
    select studio_group."categoryId" into group_category_id
    from public."Group" studio_group
    where studio_group.id = new."trialGroupId";
    if not found then
      raise exception 'Group record not found.' using errcode = 'P0002';
    end if;
    if new."categoryId" is not null and new."categoryId" <> group_category_id then
      raise exception 'The group does not belong to the lead interested category.' using errcode = '23514';
    end if;
    new."categoryId" := group_category_id;
  end if;
  return new;
end;
$$;

create trigger "Lead_sync_category_from_trial_group"
before insert or update of "trialGroupId", "categoryId" on public."Lead"
for each row execute function public.sync_lead_category_from_trial_group();

revoke all on function public.sync_client_category_from_group() from public, anon, authenticated;
revoke all on function public.sync_lead_category_from_trial_group() from public, anon, authenticated;

-- Non-client cash-in is kept separate from Payment so subscription receipts
-- and the required client payment ledger remain strict and unchanged.
create table public."StudioIncome" (
  "id" uuid primary key default gen_random_uuid(),
  "incomeNumber" text not null unique,
  "sourceLabel" text not null check (char_length(trim("sourceLabel")) between 2 and 120),
  "amount" numeric(12, 2) not null check ("amount" > 0),
  "currency" text not null default 'EGP' check (char_length("currency") = 3),
  "method" text not null check ("method" in ('CASH', 'VISA', 'INSTA_PAY')),
  "note" text check ("note" is null or char_length("note") <= 300),
  "occurredAt" timestamptz not null,
  "createdById" text not null references public."User"("id") on delete restrict,
  "createdAt" timestamptz not null default now()
);

create index "StudioIncome_occurred_idx" on public."StudioIncome" ("occurredAt" desc);
create index "StudioIncome_createdById_idx" on public."StudioIncome" ("createdById");

alter table public."StudioIncome" enable row level security;
revoke all on table public."StudioIncome" from anon, authenticated;
grant all on table public."StudioIncome" to service_role;

create or replace function public.record_studio_income(
  p_source_label text,
  p_amount numeric,
  p_currency text,
  p_method text,
  p_note text,
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
  if nullif(trim(p_source_label), '') is null
     or char_length(trim(p_source_label)) not between 2 and 120 then
    raise exception 'Income source must be 2 to 120 characters.' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Income amount must be positive.' using errcode = '22023';
  end if;
  if p_method not in ('CASH', 'VISA', 'INSTA_PAY') then
    raise exception 'Choose a valid income payment method.' using errcode = '22023';
  end if;
  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then
    raise exception 'Income date cannot be in the future.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public."User" studio_user
    where studio_user.id = p_created_by_id and studio_user.role = 'ADMIN'
  ) then
    raise exception 'Admin account not found.' using errcode = 'P0002';
  end if;

  insert into public."StudioIncome" (
    "id", "incomeNumber", "sourceLabel", "amount", "currency", "method",
    "note", "occurredAt", "createdById"
  ) values (
    entry_id,
    'MFS-IN-' || to_char(p_occurred_at, 'YYYYMM') || '-' || upper(left(replace(entry_id::text, '-', ''), 10)),
    trim(p_source_label),
    p_amount,
    upper(coalesce(nullif(trim(p_currency), ''), 'EGP')),
    p_method,
    nullif(trim(p_note), ''),
    p_occurred_at,
    p_created_by_id
  );
  return entry_id;
end;
$$;

revoke all on function public.record_studio_income(text, numeric, text, text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.record_studio_income(text, numeric, text, text, text, timestamptz, text)
  to service_role;

commit;
