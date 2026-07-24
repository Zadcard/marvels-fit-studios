-- Migration: 20260727030000_remove_legacy_transformation_tables.sql
-- Description: Drop unused legacy transformation and workout tracking tables outside current product scope

-- 1. Drop functions
DROP FUNCTION IF EXISTS public.save_training_program(uuid,text,text,text,text,"ProgramStatus",date,date);
DROP FUNCTION IF EXISTS public.record_workout_performance(text,uuid,text,uuid,integer,numeric,numeric,text,numeric,integer,integer,text);

-- 2. Drop legacy tables CASCADE
DROP TABLE IF EXISTS public."WorkoutSetLog" CASCADE;
DROP TABLE IF EXISTS public."WorkoutLog" CASCADE;
DROP TABLE IF EXISTS public."WorkoutExercise" CASCADE;
DROP TABLE IF EXISTS public."ProgramWorkout" CASCADE;
DROP TABLE IF EXISTS public."TrainingProgram" CASCADE;
DROP TABLE IF EXISTS public."ProgressMetric" CASCADE;
DROP TABLE IF EXISTS public."ClientGoal" CASCADE;
DROP TABLE IF EXISTS public."ClientAssessment" CASCADE;
DROP TABLE IF EXISTS public."ClientCheckIn" CASCADE;

-- 3. Drop legacy enums if no longer referenced
DROP TYPE IF EXISTS public."ProgramStatus" CASCADE;
DROP TYPE IF EXISTS public."AssessmentType" CASCADE;
DROP TYPE IF EXISTS public."GoalStatus" CASCADE;
