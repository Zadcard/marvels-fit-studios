-- Location and capacity are no longer collected for sessions. Private
-- sessions keep capacity 1 (prevents double booking); group sessions store
-- NULL capacity, which the booking RPC already treats as unlimited.

-- Drop the template check that required a positive capacity for GROUP series.
do $$
declare violated_constraint record;
begin
  for violated_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public."RecurringSessionTemplate"'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%capacity%'
  loop
    execute format(
      'alter table public."RecurringSessionTemplate" drop constraint %I',
      violated_constraint.conname
    );
  end loop;
end;
$$;

alter table public."RecurringSessionTemplate"
  add constraint "RecurringSessionTemplate_capacity_check"
  check (
    "capacity" is null
    or ("type" = 'PRIVATE' and "capacity" = 1)
    or ("type" = 'GROUP' and "capacity" > 0)
  );

-- Clear stored values so existing sessions behave like newly created ones.
update public."RecurringSessionTemplate"
set "capacity" = case when "type" = 'PRIVATE' then 1 else null end,
    "location" = null;

update public."TrainingSession"
set "capacity" = case when "type" = 'PRIVATE' then 1 else null end,
    "location" = null;
