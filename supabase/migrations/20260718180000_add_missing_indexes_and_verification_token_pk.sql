-- Performance advisors flagged ~22 foreign keys without a covering index
-- and VerificationToken having no primary key. At current demo scale this
-- is not a latency problem, but joins/cascades will degrade as data grows
-- and a keyless auth table is operationally awkward. This adds the missing
-- indexes and promotes VerificationToken's existing unique composite index
-- to a primary key.

create index if not exists "Account_userId_idx" on public."Account" ("userId");
create index if not exists "BillingLedgerEntry_createdById_idx" on public."BillingLedgerEntry" ("createdById");
create index if not exists "Client_groupId_idx" on public."Client" ("groupId");
create index if not exists "ClientAssessment_assessorId_idx" on public."ClientAssessment" ("assessorId");
create index if not exists "ClientCheckIn_respondedById_idx" on public."ClientCheckIn" ("respondedById");
create index if not exists "ClientGoal_createdById_idx" on public."ClientGoal" ("createdById");
create index if not exists "Exercise_createdById_idx" on public."Exercise" ("createdById");
create index if not exists "Group_coachId_idx" on public."Group" ("coachId");
create index if not exists "Payment_clientId_idx" on public."Payment" ("clientId");
create index if not exists "Payment_clientSubscriptionId_idx" on public."Payment" ("clientSubscriptionId");
create index if not exists "ProgressMetric_recordedById_idx" on public."ProgressMetric" ("recordedById");
create index if not exists "RecurringSessionTemplate_coachId_idx" on public."RecurringSessionTemplate" ("coachId");
create index if not exists "RecurringSessionTemplate_createdById_idx" on public."RecurringSessionTemplate" ("createdById");
create index if not exists "RecurringSessionTemplate_groupId_idx" on public."RecurringSessionTemplate" ("groupId");
create index if not exists "Session_userId_idx" on public."Session" ("userId");
create index if not exists "SessionCompensation_approvedById_idx" on public."SessionCompensation" ("approvedById");
create index if not exists "SessionCompensation_clientId_idx" on public."SessionCompensation" ("clientId");
create index if not exists "TrainingProgram_coachId_idx" on public."TrainingProgram" ("coachId");
create index if not exists "WorkoutExercise_exerciseId_idx" on public."WorkoutExercise" ("exerciseId");
create index if not exists "WorkoutLog_programWorkoutId_idx" on public."WorkoutLog" ("programWorkoutId");
create index if not exists "WorkoutLog_recordedById_idx" on public."WorkoutLog" ("recordedById");
create index if not exists "WorkoutLog_trainingSessionId_idx" on public."WorkoutLog" ("trainingSessionId");
create index if not exists "WorkoutSetLog_exerciseId_idx" on public."WorkoutSetLog" ("exerciseId");

alter table public."VerificationToken"
  add constraint "VerificationToken_pkey"
  primary key using index "VerificationToken_identifier_token_key";
