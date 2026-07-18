-- Persist the stages represented by the Leads & Trials board.
alter type public."LeadStatus" add value if not exists 'TRIAL_DONE';

alter table public."Lead"
  add column if not exists "trialGroupId" text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'Lead_trialGroupId_fkey'
  ) then
    alter table public."Lead"
      add constraint "Lead_trialGroupId_fkey"
      foreign key ("trialGroupId") references public."Group"(id)
      on delete set null on update cascade;
  end if;
end;
$$;

create index if not exists "Lead_trialGroupId_idx" on public."Lead"("trialGroupId");

-- Promotion keeps the chosen trial group when the lead becomes a client.
create or replace function public.promote_lead_to_client(
  target_lead_id uuid,
  generated_client_id text,
  hashed_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_lead public."Lead"%rowtype;
  target_user public."User"%rowtype;
  normalized_email text;
  had_existing_user boolean := false;
begin
  select * into target_lead from public."Lead" where id = target_lead_id;
  if not found then raise exception 'Lead not found.'; end if;
  normalized_email := nullif(lower(trim(target_lead.email)), '');
  if normalized_email is not null then
    select * into target_user from public."User" where email = normalized_email;
    had_existing_user := found;
  end if;

  if had_existing_user and target_user.role <> 'CLIENT'
    and not exists (select 1 from public."Client" where "userId" = target_user.id) then
    return jsonb_build_object('outcome','skipped','role',target_user.role);
  end if;

  if not had_existing_user then
    insert into public."User" (email,name,"clientId",password,"mustChangePassword",role)
      values (normalized_email,target_lead."fullName",generated_client_id,hashed_password,true,'CLIENT')
      returning * into target_user;
  else
    update public."User" set
      name=coalesce(name,target_lead."fullName"),
      email=coalesce(email,normalized_email),
      "clientId"=coalesce("clientId",generated_client_id),
      password=hashed_password,"mustChangePassword"=true,role='CLIENT',"updatedAt"=now()
      where id=target_user.id returning * into target_user;
  end if;

  if not exists (select 1 from public."Client" where "userId"=target_user.id) then
    insert into public."Client" ("fullName",phone,"userId","groupId")
      values (target_lead."fullName",target_lead.phone,target_user.id,target_lead."trialGroupId");
  else
    update public."Client"
      set "groupId" = coalesce("groupId", target_lead."trialGroupId")
      where "userId" = target_user.id;
  end if;

  update public."Lead" set status='CONVERTED',"updatedAt"=now() where id=target_lead.id;
  return jsonb_build_object('outcome','promoted','existingUser',had_existing_user);
end;
$$;

revoke all on function public.promote_lead_to_client(uuid,text,text) from public, anon, authenticated;
grant execute on function public.promote_lead_to_client(uuid,text,text) to service_role;
