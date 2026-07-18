create or replace function public.delete_recurring_session_template(
  p_template_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public."RecurringSessionTemplate" template
  where template."id" = p_template_id
  for update;
  if not found then
    raise exception 'Recurring template not found.' using errcode = 'P0002';
  end if;
  if exists (
    select 1
    from public."TrainingSession" session_record
    where session_record."sourceTemplateId" = p_template_id
  ) then
    raise exception 'Recurring template has generated occurrences.' using errcode = 'P0001';
  end if;

  delete from public."RecurringSessionTemplate" template
  where template."id" = p_template_id;
end;
$$;

revoke all on function public.delete_recurring_session_template(uuid)
from public, anon, authenticated;
grant execute on function public.delete_recurring_session_template(uuid)
to service_role;
