-- Remove recurring schedule blocks while preserving concrete sessions.
ALTER TABLE "TrainingSession" DROP CONSTRAINT IF EXISTS "TrainingSession_scheduleBlockId_fkey";
DROP INDEX IF EXISTS "TrainingSession_scheduleBlockId_idx";
ALTER TABLE "TrainingSession" DROP COLUMN IF EXISTS "scheduleBlockId";

DROP TABLE IF EXISTS "ScheduleBlockClient";
DROP TABLE IF EXISTS "ScheduleBlock";

DROP TYPE IF EXISTS "ScheduleBlockStatus";
DROP TYPE IF EXISTS "ScheduleRecurrenceType";
DROP TYPE IF EXISTS "ScheduleDay";

-- Coach-uploaded files, scoped to either a client or a group, expire after 3 days.
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "size" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "data" BYTEA;
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() + INTERVAL '3 days');
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "downloadedAt" TIMESTAMP(3);
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "uploadedById" TEXT;
ALTER TABLE "File" ALTER COLUMN "path" SET DEFAULT '';

ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "File_clientId_idx" ON "File"("clientId");
CREATE INDEX IF NOT EXISTS "File_groupId_idx" ON "File"("groupId");
CREATE INDEX IF NOT EXISTS "File_uploadedById_idx" ON "File"("uploadedById");
CREATE INDEX IF NOT EXISTS "File_expiresAt_idx" ON "File"("expiresAt");

-- Private coach/admin client notes.
ALTER TABLE "WorkoutNote" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WorkoutNote" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "WorkoutNote" ADD COLUMN IF NOT EXISTS "authorId" TEXT;

ALTER TABLE "WorkoutNote" ADD CONSTRAINT "WorkoutNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WorkoutNote_clientId_idx" ON "WorkoutNote"("clientId");
CREATE INDEX IF NOT EXISTS "WorkoutNote_authorId_idx" ON "WorkoutNote"("authorId");

-- Remove general notification settings; file availability is shown in-app.
ALTER TABLE "StudioSettings" DROP COLUMN IF EXISTS "coachAutoReminders";
ALTER TABLE "StudioSettings" DROP COLUMN IF EXISTS "memberCheckInAlerts";
ALTER TABLE "StudioSettings" DROP COLUMN IF EXISTS "renewalDigest";
ALTER TABLE "ClientPreferences" DROP COLUMN IF EXISTS "notificationEmail";
ALTER TABLE "ClientPreferences" DROP COLUMN IF EXISTS "scheduleReminders";
ALTER TABLE "ClientPreferences" DROP COLUMN IF EXISTS "coachUpdates";
