create or replace function public.save_client_settings(
  p_user_id text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_goal_label text,
  p_preferred_session_time text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_client_id text;
begin
  if exists (select 1 from public."User" where "email" = p_email and "id" <> p_user_id) then
    raise exception 'Another user already uses this email.' using errcode = '23505';
  end if;

  update public."User" set "name" = p_full_name, "email" = p_email where "id" = p_user_id;

  update public."Client"
  set "fullName" = p_full_name, "phone" = nullif(p_phone, '')
  where "userId" = p_user_id
  returning "id" into target_client_id;

  if target_client_id is null then
    raise exception 'Client profile not found.' using errcode = 'P0002';
  end if;

  insert into public."ClientPreferences" ("clientId", "goalLabel", "preferredSessionTime")
  values (
    target_client_id,
    coalesce(nullif(p_goal_label, ''), 'Build steady strength and improve movement confidence.'),
    coalesce(nullif(p_preferred_session_time, ''), 'Flexible')
  )
  on conflict ("clientId") do update set
    "goalLabel" = excluded."goalLabel",
    "preferredSessionTime" = excluded."preferredSessionTime";
end;
$$;

revoke all on function public.save_client_settings(text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.save_client_settings(text, text, text, text, text, text)
  to service_role;
