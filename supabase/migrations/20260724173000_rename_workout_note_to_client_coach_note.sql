-- Rename legacy WorkoutNote table to ClientCoachNote to accurately reflect in-scope coach/rehab client private notes

ALTER TABLE IF EXISTS "WorkoutNote" RENAME TO "ClientCoachNote";

-- Rename indexes
ALTER INDEX IF EXISTS "WorkoutNote_pkey" RENAME TO "ClientCoachNote_pkey";
ALTER INDEX IF EXISTS "WorkoutNote_clientId_idx" RENAME TO "ClientCoachNote_clientId_idx";
ALTER INDEX IF EXISTS "WorkoutNote_authorId_idx" RENAME TO "ClientCoachNote_authorId_idx";

-- Rename foreign key constraints
ALTER TABLE "ClientCoachNote" RENAME CONSTRAINT "WorkoutNote_clientId_fkey" TO "ClientCoachNote_clientId_fkey";
ALTER TABLE "ClientCoachNote" RENAME CONSTRAINT "WorkoutNote_authorId_fkey" TO "ClientCoachNote_authorId_fkey";

-- Update updated_at trigger
DROP TRIGGER IF EXISTS "WorkoutNote_set_updated_at" ON "ClientCoachNote";
CREATE TRIGGER "ClientCoachNote_set_updated_at"
BEFORE UPDATE ON "ClientCoachNote"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS & set policies
ALTER TABLE "ClientCoachNote" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ClientCoachNote_staff_all" ON "ClientCoachNote";
CREATE POLICY "ClientCoachNote_staff_all" ON "ClientCoachNote"
FOR ALL TO authenticated
USING (
  (auth.jwt() ->> 'role') IN ('ADMIN', 'COACH')
);
