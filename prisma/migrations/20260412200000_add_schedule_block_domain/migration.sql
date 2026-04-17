CREATE TYPE "ScheduleBlockStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "ScheduleRecurrenceType" AS ENUM ('WEEKLY');
CREATE TYPE "ScheduleDay" AS ENUM (
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
);
CREATE TYPE "BookingSource" AS ENUM ('BLOCK', 'MANUAL');

CREATE TABLE "ScheduleBlock" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sessionType" "TrainingSessionType" NOT NULL,
  "status" "ScheduleBlockStatus" NOT NULL DEFAULT 'ACTIVE',
  "recurrenceType" "ScheduleRecurrenceType" NOT NULL DEFAULT 'WEEKLY',
  "recurrenceDays" "ScheduleDay"[] NOT NULL,
  "startsOn" TIMESTAMP(3) NOT NULL,
  "endsOn" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
  "capacity" INTEGER,
  "location" TEXT,
  "coachId" TEXT NOT NULL,
  "groupId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleBlockClient" (
  "id" TEXT NOT NULL,
  "scheduleBlockId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ScheduleBlockClient_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainingSession" ADD COLUMN "scheduleBlockId" TEXT;
ALTER TABLE "SessionBooking" ADD COLUMN "source" "BookingSource" NOT NULL DEFAULT 'MANUAL';

CREATE UNIQUE INDEX "ScheduleBlockClient_scheduleBlockId_clientId_key"
ON "ScheduleBlockClient"("scheduleBlockId", "clientId");

CREATE INDEX "ScheduleBlock_coachId_idx" ON "ScheduleBlock"("coachId");
CREATE INDEX "ScheduleBlock_groupId_idx" ON "ScheduleBlock"("groupId");
CREATE INDEX "ScheduleBlock_status_idx" ON "ScheduleBlock"("status");
CREATE INDEX "ScheduleBlock_startsOn_idx" ON "ScheduleBlock"("startsOn");
CREATE INDEX "ScheduleBlock_endsOn_idx" ON "ScheduleBlock"("endsOn");
CREATE INDEX "ScheduleBlockClient_clientId_idx" ON "ScheduleBlockClient"("clientId");
CREATE INDEX "TrainingSession_scheduleBlockId_idx" ON "TrainingSession"("scheduleBlockId");

ALTER TABLE "ScheduleBlock"
ADD CONSTRAINT "ScheduleBlock_coachId_fkey"
FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScheduleBlock"
ADD CONSTRAINT "ScheduleBlock_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScheduleBlock"
ADD CONSTRAINT "ScheduleBlock_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScheduleBlockClient"
ADD CONSTRAINT "ScheduleBlockClient_scheduleBlockId_fkey"
FOREIGN KEY ("scheduleBlockId") REFERENCES "ScheduleBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleBlockClient"
ADD CONSTRAINT "ScheduleBlockClient_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingSession"
ADD CONSTRAINT "TrainingSession_scheduleBlockId_fkey"
FOREIGN KEY ("scheduleBlockId") REFERENCES "ScheduleBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
