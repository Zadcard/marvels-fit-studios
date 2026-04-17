-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Client'
      AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Client" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;

-- CreateTable
CREATE TABLE "StudioSettings" (
    "id" TEXT NOT NULL,
    "studioName" TEXT NOT NULL DEFAULT 'Marvel Fitness Studio',
    "supportEmail" TEXT NOT NULL DEFAULT 'hello@marvelfitness.studio',
    "supportPhone" TEXT NOT NULL DEFAULT '+20 10 5555 9084',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "defaultSessionLength" TEXT NOT NULL DEFAULT '60 minutes',
    "intakeLeadTime" TEXT NOT NULL DEFAULT '24 hours',
    "overbookWaitlist" BOOLEAN NOT NULL DEFAULT true,
    "coachAutoReminders" BOOLEAN NOT NULL DEFAULT true,
    "memberCheckInAlerts" BOOLEAN NOT NULL DEFAULT true,
    "renewalDigest" BOOLEAN NOT NULL DEFAULT false,
    "cancellationWindow" TEXT NOT NULL DEFAULT '6 hours',
    "privateSessionBuffer" TEXT NOT NULL DEFAULT '15 minutes',
    "scheduleStartDay" TEXT NOT NULL DEFAULT 'Monday',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreferences" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "goalLabel" TEXT NOT NULL DEFAULT 'Build steady strength and improve movement confidence.',
    "preferredSessionTime" TEXT NOT NULL DEFAULT 'Flexible',
    "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "scheduleReminders" BOOLEAN NOT NULL DEFAULT true,
    "coachUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientPreferences_clientId_key" ON "ClientPreferences"("clientId");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- AddForeignKey
ALTER TABLE "ClientPreferences" ADD CONSTRAINT "ClientPreferences_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
