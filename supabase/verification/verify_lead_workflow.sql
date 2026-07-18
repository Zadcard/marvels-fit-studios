do $$
declare
  invalid_count integer;
begin
  select count(*) into invalid_count
  from public."Lead"
  where "status" in ('CONTACTED', 'TRIAL_DONE')
    and "trialGroupId" is null;

  if invalid_count <> 0 then
    raise exception 'Found % staged leads without a trial group.', invalid_count;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'Lead_trial_group_stage_check'
      and conrelid = 'public."Lead"'::regclass
  ) then
    raise exception 'Lead trial-stage integrity constraint is missing.';
  end if;
end;
$$;
