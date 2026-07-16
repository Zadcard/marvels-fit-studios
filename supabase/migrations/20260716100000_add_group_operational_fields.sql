-- Phase 6 (groups): give a Group the operational fields Marvel needs so admins
-- can run group training from one place — training category, optional capacity,
-- an active flag, and notes. Additive and non-destructive (defaults backfill).

alter table "Group"
  add column "trainingCategory" "TrainingCategory" not null default 'GENERAL_FITNESS',
  add column "capacity" integer,
  add column "isActive" boolean not null default true,
  add column "notes" text;

create index "Group_trainingCategory_idx" on "Group" ("trainingCategory");
create index "Group_isActive_idx" on "Group" ("isActive");
