update public."Lead"
set "status" = 'NEW',
    "updatedAt" = now()
where "status" in ('CONTACTED', 'TRIAL_DONE')
  and "trialGroupId" is null;

alter table public."Lead"
  add constraint "Lead_trial_group_stage_check"
  check (
    "status" not in ('CONTACTED', 'TRIAL_DONE')
    or "trialGroupId" is not null
  );
