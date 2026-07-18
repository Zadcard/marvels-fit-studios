-- New coach accounts receive a one-time random password from the guarded admin
-- action. Force the account through /change-password before dashboard access.

create or replace function public.save_coach(
  p_coach_id text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_specialization public."CoachSpecialization",
  p_password_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id text;
  created_user_id text;
begin
  if nullif(p_coach_id, '') is not null then
    select "userId" into target_user_id
    from public."Coach"
    where id = p_coach_id
    for update;

    if target_user_id is null then
      raise exception 'Coach record not found.' using errcode = 'P0002';
    end if;

    if exists (
      select 1
      from public."User"
      where email = p_email and id <> target_user_id
    ) then
      raise exception 'Another user already uses this email.' using errcode = '23505';
    end if;

    update public."User"
    set name = p_full_name, email = p_email, "updatedAt" = now()
    where id = target_user_id;

    update public."Coach"
    set
      "fullName" = p_full_name,
      phone = nullif(p_phone, ''),
      specialization = p_specialization
    where id = p_coach_id;
  else
    if exists (select 1 from public."User" where email = p_email) then
      raise exception 'A user with this email already exists.' using errcode = '23505';
    end if;

    insert into public."User" (
      name,
      email,
      password,
      "mustChangePassword",
      role
    )
    values (
      p_full_name,
      p_email,
      p_password_hash,
      true,
      'COACH'
    )
    returning id into created_user_id;

    insert into public."Coach" (
      "fullName",
      phone,
      specialization,
      "userId"
    )
    values (
      p_full_name,
      nullif(p_phone, ''),
      p_specialization,
      created_user_id
    );
  end if;
end;
$$;

revoke all on function public.save_coach(text, text, text, text, public."CoachSpecialization", text)
  from public, anon, authenticated;
grant execute on function public.save_coach(text, text, text, text, public."CoachSpecialization", text)
  to service_role;
