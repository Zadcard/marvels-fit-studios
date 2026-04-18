-- Baseline fields that exist in the live Neon database and Prisma schema.
-- Mark this migration as applied on the current database to reconcile
-- Prisma Migrate history without resetting data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'CoachSpecialization'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "CoachSpecialization" AS ENUM ('STRENGTH', 'CONDITIONING', 'MOBILITY', 'PRIVATE_COACHING');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ClientLifecycleStatus'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "ClientLifecycleStatus" AS ENUM ('ACTIVE', 'PENDING', 'PAUSED');
  END IF;
END $$;

ALTER TABLE "Coach"
ADD COLUMN IF NOT EXISTS "specialization" "CoachSpecialization" NOT NULL DEFAULT 'STRENGTH';

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "status" "ClientLifecycleStatus" NOT NULL DEFAULT 'PENDING';
