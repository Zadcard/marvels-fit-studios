create type "AssessmentStatus" as enum ('DRAFT', 'COMPLETE');
create type "GoalStatus" as enum ('ACTIVE', 'ACHIEVED', 'PAUSED', 'CANCELED');
create type "ProgramStatus" as enum ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

create table "ClientAssessment" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete cascade,
  "assessorId" text not null references "User"("id") on delete restrict,
  "status" "AssessmentStatus" not null default 'DRAFT',
  "experienceLevel" text not null,
  "primaryGoal" text not null,
  "secondaryGoals" text,
  "injuriesLimitations" text,
  "medicalNotes" text,
  "baselineSummary" text,
  "consentAcknowledgedAt" timestamptz,
  "assessedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "ClientGoal" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete cascade,
  "createdById" text not null references "User"("id") on delete restrict,
  "title" text not null,
  "description" text,
  "metricType" text,
  "baselineValue" numeric,
  "targetValue" numeric,
  "currentValue" numeric,
  "unit" text,
  "targetDate" date,
  "status" "GoalStatus" not null default 'ACTIVE',
  "achievedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "Exercise" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null unique,
  "category" text not null,
  "instructions" text,
  "defaultUnit" text,
  "isActive" boolean not null default true,
  "createdById" text references "User"("id") on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "TrainingProgram" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete cascade,
  "coachId" text not null references "Coach"("id") on delete restrict,
  "name" text not null,
  "goalSummary" text,
  "status" "ProgramStatus" not null default 'DRAFT',
  "startsAt" date not null,
  "endsAt" date,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check ("endsAt" is null or "endsAt" >= "startsAt")
);

create table "ProgramWorkout" (
  "id" uuid primary key default gen_random_uuid(),
  "programId" uuid not null references "TrainingProgram"("id") on delete cascade,
  "title" text not null,
  "dayOrder" integer not null check ("dayOrder" > 0),
  "notes" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("programId", "dayOrder")
);

create table "WorkoutExercise" (
  "id" uuid primary key default gen_random_uuid(),
  "workoutId" uuid not null references "ProgramWorkout"("id") on delete cascade,
  "exerciseId" uuid not null references "Exercise"("id") on delete restrict,
  "orderIndex" integer not null check ("orderIndex" > 0),
  "sets" integer not null default 3 check ("sets" > 0 and "sets" <= 20),
  "reps" text not null,
  "targetLoad" numeric,
  "loadUnit" text,
  "tempo" text,
  "restSeconds" integer check ("restSeconds" is null or "restSeconds" >= 0),
  "notes" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("workoutId", "orderIndex")
);

create table "WorkoutLog" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete cascade,
  "programWorkoutId" uuid references "ProgramWorkout"("id") on delete set null,
  "trainingSessionId" text references "TrainingSession"("id") on delete set null,
  "recordedById" text not null references "User"("id") on delete restrict,
  "performedAt" timestamptz not null default now(),
  "durationMinutes" integer check ("durationMinutes" is null or "durationMinutes" > 0),
  "sessionRpe" integer check ("sessionRpe" is null or "sessionRpe" between 1 and 10),
  "notes" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "WorkoutSetLog" (
  "id" uuid primary key default gen_random_uuid(),
  "workoutLogId" uuid not null references "WorkoutLog"("id") on delete cascade,
  "exerciseId" uuid not null references "Exercise"("id") on delete restrict,
  "setNumber" integer not null check ("setNumber" > 0),
  "reps" numeric,
  "load" numeric,
  "loadUnit" text,
  "rpe" numeric check ("rpe" is null or "rpe" between 1 and 10),
  "completed" boolean not null default true,
  "notes" text,
  "createdAt" timestamptz not null default now(),
  unique ("workoutLogId", "exerciseId", "setNumber")
);

create table "ProgressMetric" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete cascade,
  "recordedById" text not null references "User"("id") on delete restrict,
  "metricType" text not null,
  "value" numeric not null,
  "unit" text not null,
  "measuredAt" timestamptz not null default now(),
  "note" text,
  "createdAt" timestamptz not null default now()
);

create table "ClientCheckIn" (
  "id" uuid primary key default gen_random_uuid(),
  "clientId" text not null references "Client"("id") on delete cascade,
  "sleepQuality" integer not null check ("sleepQuality" between 1 and 5),
  "energyLevel" integer not null check ("energyLevel" between 1 and 5),
  "sorenessLevel" integer not null check ("sorenessLevel" between 1 and 5),
  "stressLevel" integer not null check ("stressLevel" between 1 and 5),
  "painPresent" boolean not null default false,
  "painDetails" text,
  "memberNote" text,
  "coachResponse" text,
  "respondedById" text references "User"("id") on delete set null,
  "respondedAt" timestamptz,
  "submittedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  check (not "painPresent" or nullif(trim("painDetails"), '') is not null)
);

create unique index "TrainingProgram_one_active_per_client_idx"
  on "TrainingProgram" ("clientId") where "status" = 'ACTIVE';
create index "ClientAssessment_clientId_assessedAt_idx"
  on "ClientAssessment" ("clientId", "assessedAt" desc);
create index "ClientGoal_clientId_status_idx"
  on "ClientGoal" ("clientId", "status");
create index "TrainingProgram_clientId_status_idx"
  on "TrainingProgram" ("clientId", "status");
create index "WorkoutLog_clientId_performedAt_idx"
  on "WorkoutLog" ("clientId", "performedAt" desc);
create index "ProgressMetric_clientId_metricType_measuredAt_idx"
  on "ProgressMetric" ("clientId", "metricType", "measuredAt" desc);
create index "ClientCheckIn_clientId_submittedAt_idx"
  on "ClientCheckIn" ("clientId", "submittedAt" desc);

create trigger "ClientAssessment_set_updated_at"
before update on "ClientAssessment"
for each row execute function public.set_updated_at();
create trigger "ClientGoal_set_updated_at"
before update on "ClientGoal"
for each row execute function public.set_updated_at();
create trigger "Exercise_set_updated_at"
before update on "Exercise"
for each row execute function public.set_updated_at();
create trigger "TrainingProgram_set_updated_at"
before update on "TrainingProgram"
for each row execute function public.set_updated_at();
create trigger "ProgramWorkout_set_updated_at"
before update on "ProgramWorkout"
for each row execute function public.set_updated_at();
create trigger "WorkoutExercise_set_updated_at"
before update on "WorkoutExercise"
for each row execute function public.set_updated_at();
create trigger "WorkoutLog_set_updated_at"
before update on "WorkoutLog"
for each row execute function public.set_updated_at();
create trigger "ClientCheckIn_set_updated_at"
before update on "ClientCheckIn"
for each row execute function public.set_updated_at();

alter table "ClientAssessment" enable row level security;
alter table "ClientGoal" enable row level security;
alter table "Exercise" enable row level security;
alter table "TrainingProgram" enable row level security;
alter table "ProgramWorkout" enable row level security;
alter table "WorkoutExercise" enable row level security;
alter table "WorkoutLog" enable row level security;
alter table "WorkoutSetLog" enable row level security;
alter table "ProgressMetric" enable row level security;
alter table "ClientCheckIn" enable row level security;

revoke all on table "ClientAssessment" from anon, authenticated;
revoke all on table "ClientGoal" from anon, authenticated;
revoke all on table "Exercise" from anon, authenticated;
revoke all on table "TrainingProgram" from anon, authenticated;
revoke all on table "ProgramWorkout" from anon, authenticated;
revoke all on table "WorkoutExercise" from anon, authenticated;
revoke all on table "WorkoutLog" from anon, authenticated;
revoke all on table "WorkoutSetLog" from anon, authenticated;
revoke all on table "ProgressMetric" from anon, authenticated;
revoke all on table "ClientCheckIn" from anon, authenticated;

grant all on table "ClientAssessment" to service_role;
grant all on table "ClientGoal" to service_role;
grant all on table "Exercise" to service_role;
grant all on table "TrainingProgram" to service_role;
grant all on table "ProgramWorkout" to service_role;
grant all on table "WorkoutExercise" to service_role;
grant all on table "WorkoutLog" to service_role;
grant all on table "WorkoutSetLog" to service_role;
grant all on table "ProgressMetric" to service_role;
grant all on table "ClientCheckIn" to service_role;
