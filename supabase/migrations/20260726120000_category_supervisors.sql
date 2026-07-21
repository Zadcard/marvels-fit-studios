-- A category can have multiple coach supervisors. This relationship is
-- independent from coach qualifications and group coaching assignments.

begin;

create table public."CategorySupervisor" (
  "categoryId" text not null,
  "coachId" text not null,
  "createdAt" timestamptz not null default current_timestamp,
  constraint "CategorySupervisor_pkey" primary key ("categoryId", "coachId"),
  constraint "CategorySupervisor_categoryId_fkey"
    foreign key ("categoryId") references public."TrainingCategory"("id")
    on delete restrict on update cascade,
  constraint "CategorySupervisor_coachId_fkey"
    foreign key ("coachId") references public."Coach"("id")
    on delete cascade on update cascade
);

create index "CategorySupervisor_coachId_idx"
  on public."CategorySupervisor" ("coachId");

create or replace function public.set_category_supervisors(
  p_category_id text,
  p_coach_ids text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public."TrainingCategory" category
    where category."id" = p_category_id
  ) then
    raise exception 'Training category not found.' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_coach_ids, array[]::text[])) requested("coachId")
    left join public."Coach" coach on coach."id" = requested."coachId"
    where coach."id" is null
  ) then
    raise exception 'One or more supervisors are not valid coaches.' using errcode = '22023';
  end if;

  delete from public."CategorySupervisor"
  where "categoryId" = p_category_id
    and not ("coachId" = any(coalesce(p_coach_ids, array[]::text[])));

  insert into public."CategorySupervisor" ("categoryId", "coachId")
  select p_category_id, requested."coachId"
  from (
    select distinct unnest(coalesce(p_coach_ids, array[]::text[])) as "coachId"
  ) requested
  on conflict do nothing;
end;
$$;

create or replace function public.sync_group_memberships(
  p_group_id text,
  p_client_ids text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public."Group" where "id" = p_group_id for update;
  if not found then
    raise exception 'Group record not found.' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_client_ids, array[]::text[])) requested("clientId")
    left join public."Client" client on client."id" = requested."clientId"
    where client."id" is null
  ) then
    raise exception 'One or more clients could not be found.' using errcode = '22023';
  end if;

  update public."Client"
  set "groupId" = null
  where "groupId" = p_group_id
    and not ("id" = any(coalesce(p_client_ids, array[]::text[])));

  update public."Client"
  set "groupId" = p_group_id
  where "id" = any(coalesce(p_client_ids, array[]::text[]));
end;
$$;

alter table public."CategorySupervisor" enable row level security;

revoke all on table public."CategorySupervisor" from public, anon, authenticated;
grant all on table public."CategorySupervisor" to service_role;
revoke all on function public.set_category_supervisors(text, text[])
from public, anon, authenticated;
grant execute on function public.set_category_supervisors(text, text[])
to service_role;
revoke all on function public.sync_group_memberships(text, text[])
from public, anon, authenticated;
grant execute on function public.sync_group_memberships(text, text[])
to service_role;

commit;
