-- TrainingSession instants are stored with timezone information. Recurring
-- templates remain Cairo civil schedules (weekday + local time + timezone),
-- and linked occurrences must either match that schedule or be marked as an
-- explicit occurrence-level exception.

alter table public."TrainingSession"
  drop constraint if exists "TrainingSession_coach_active_time_excl";

alter table public."TrainingSession"
  alter column "startsAt" type timestamptz
    using "startsAt" at time zone 'Africa/Cairo',
  alter column "endsAt" type timestamptz
    using "endsAt" at time zone 'Africa/Cairo';

alter table public."TrainingSession"
  add column "isTemplateException" boolean not null default false;

alter table public."TrainingSession"
  add constraint "TrainingSession_coach_active_time_excl"
  exclude using gist (
    "coachId" with =,
    tstzrange("startsAt", "endsAt", '[)') with &&
  )
  where ("status" in ('DRAFT', 'SCHEDULED'));

-- The bulk reassignment function contains explicit range comparisons. Rebuild
-- it against timestamptz ranges without duplicating the rest of its invariant
-- logic in this migration.
do $$
declare
  definition text;
begin
  select pg_get_functiondef(
    'public.bulk_update_training_sessions(text[],text,text,text,integer)'::regprocedure
  ) into definition;
  definition := replace(definition, 'tsrange(', 'tstzrange(');
  execute definition;
end;
$$;

-- The original demo seed attached independent future fixtures to weekly
-- templates. Keep the real same-day occurrences linked and leave the extra
-- future fixtures as manual sessions.
update public."TrainingSession"
set "sourceTemplateId" = null
where id in (
  'demo-session-strength-next',
  'demo-session-burning-next',
  'demo-session-ladies-next',
  'demo-session-athlete-next'
);

update public."TrainingSession"
set "sourceTemplateId" = '00000000-0000-4000-8000-000000000101'
where id = 'demo-session-strength-today';

update public."RecurringSessionTemplate" template
set weekday = extract(
  dow from session."startsAt" at time zone template.timezone
)::integer
from (
  values
    ('00000000-0000-4000-8000-000000000101'::uuid, 'demo-session-strength-today'),
    ('00000000-0000-4000-8000-000000000102'::uuid, 'demo-session-burning-today'),
    ('00000000-0000-4000-8000-000000000103'::uuid, 'demo-session-ladies-today'),
    ('00000000-0000-4000-8000-000000000104'::uuid, 'demo-session-athlete-today'),
    ('00000000-0000-4000-8000-000000000105'::uuid, 'demo-session-calisthenics-today')
) mapping(template_id, session_id)
join public."TrainingSession" session on session.id = mapping.session_id
where template.id = mapping.template_id;

create or replace function public.validate_training_session_template_time()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  template public."RecurringSessionTemplate"%rowtype;
  local_start timestamp;
  matches_template boolean;
begin
  if new."sourceTemplateId" is null then
    new."isTemplateException" := false;
    return new;
  end if;

  select * into template
  from public."RecurringSessionTemplate"
  where id = new."sourceTemplateId";
  if not found then
    raise exception 'Recurring session template not found.' using errcode = 'P0002';
  end if;

  local_start := new."startsAt" at time zone template.timezone;
  matches_template :=
    extract(dow from local_start)::integer = template.weekday
    and local_start::time(0) = template."localStartTime"::time(0);

  if tg_op = 'INSERT'
     or old."sourceTemplateId" is distinct from new."sourceTemplateId" then
    if not matches_template then
      raise exception 'Linked occurrence does not match the recurring template day and time.'
        using errcode = '23514';
    end if;
    new."isTemplateException" := false;
  else
    new."isTemplateException" := not matches_template;
  end if;

  return new;
end;
$$;

drop trigger if exists "TrainingSession_validate_template_time"
  on public."TrainingSession";

create trigger "TrainingSession_validate_template_time"
before insert or update of "sourceTemplateId", "startsAt"
on public."TrainingSession"
for each row
execute function public.validate_training_session_template_time();

revoke all on function public.validate_training_session_template_time()
  from public, anon, authenticated;
