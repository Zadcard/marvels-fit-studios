create or replace function public.save_training_program(
  p_program_id uuid,
  p_client_id text,
  p_coach_id text,
  p_name text,
  p_goal_summary text,
  p_status "ProgramStatus",
  p_starts_at date,
  p_ends_at date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_program_id uuid;
begin
  if p_status = 'ACTIVE' then
    update "TrainingProgram"
    set "status" = 'ARCHIVED'
    where "clientId" = p_client_id
      and "status" = 'ACTIVE'
      and (p_program_id is null or "id" <> p_program_id);
  end if;

  if p_program_id is null then
    insert into "TrainingProgram" (
      "clientId", "coachId", "name", "goalSummary", "status", "startsAt", "endsAt"
    ) values (
      p_client_id,
      p_coach_id,
      trim(p_name),
      nullif(trim(p_goal_summary), ''),
      p_status,
      p_starts_at,
      p_ends_at
    )
    returning "id" into v_program_id;
  else
    update "TrainingProgram"
    set
      "name" = trim(p_name),
      "goalSummary" = nullif(trim(p_goal_summary), ''),
      "status" = p_status,
      "startsAt" = p_starts_at,
      "endsAt" = p_ends_at
    where "id" = p_program_id
      and "clientId" = p_client_id
      and "coachId" = p_coach_id
    returning "id" into v_program_id;

    if v_program_id is null then
      raise exception 'Training program not found or not owned by this coach';
    end if;
  end if;

  return v_program_id;
end;
$$;

create or replace function public.record_workout_performance(
  p_client_id text,
  p_program_workout_id uuid,
  p_recorded_by_id text,
  p_exercise_id uuid,
  p_set_number integer,
  p_reps numeric,
  p_load numeric,
  p_load_unit text,
  p_rpe numeric,
  p_duration_minutes integer,
  p_session_rpe integer,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_log_id uuid;
begin
  if not exists (
    select 1
    from "ProgramWorkout" pw
    join "TrainingProgram" tp on tp."id" = pw."programId"
    where pw."id" = p_program_workout_id
      and tp."clientId" = p_client_id
  ) then
    raise exception 'Workout does not belong to the client';
  end if;

  insert into "WorkoutLog" (
    "clientId", "programWorkoutId", "recordedById", "durationMinutes",
    "sessionRpe", "notes"
  ) values (
    p_client_id,
    p_program_workout_id,
    p_recorded_by_id,
    p_duration_minutes,
    p_session_rpe,
    nullif(trim(p_notes), '')
  )
  returning "id" into v_log_id;

  insert into "WorkoutSetLog" (
    "workoutLogId", "exerciseId", "setNumber", "reps", "load", "loadUnit", "rpe"
  ) values (
    v_log_id,
    p_exercise_id,
    p_set_number,
    p_reps,
    p_load,
    nullif(trim(p_load_unit), ''),
    p_rpe
  );

  return v_log_id;
end;
$$;

revoke all on function public.save_training_program(uuid,text,text,text,text,"ProgramStatus",date,date)
  from public, anon, authenticated;
revoke all on function public.record_workout_performance(text,uuid,text,uuid,integer,numeric,numeric,text,numeric,integer,integer,text)
  from public, anon, authenticated;
grant execute on function public.save_training_program(uuid,text,text,text,text,"ProgramStatus",date,date)
  to service_role;
grant execute on function public.record_workout_performance(text,uuid,text,uuid,integer,numeric,numeric,text,numeric,integer,integer,text)
  to service_role;
