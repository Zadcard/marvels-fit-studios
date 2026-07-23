-- 20260727010000 reverted the abandoned multi-group (GroupMembership)
-- experiment everywhere except this one function: sync_group_memberships
-- was still targeting the dropped GroupMembership table. Restore it to its
-- original single Client.groupId form (from 20260726120000).

begin;

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

commit;
