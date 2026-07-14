create or replace function public.save_coach_settings(
  p_user_id text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_specialization public."CoachSpecialization"
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public."User"
    where "email" = p_email and "id" <> p_user_id
  ) then
    raise exception 'Another user already uses this email.' using errcode = '23505';
  end if;

  update public."User"
  set "name" = p_full_name, "email" = p_email
  where "id" = p_user_id;

  update public."Coach"
  set "fullName" = p_full_name,
      "phone" = nullif(p_phone, ''),
      "specialization" = p_specialization
  where "userId" = p_user_id;

  if not found then
    raise exception 'Coach profile not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.save_coach_settings(text, text, text, text, public."CoachSpecialization")
  from public, anon, authenticated;
grant execute on function public.save_coach_settings(text, text, text, text, public."CoachSpecialization")
  to service_role;
