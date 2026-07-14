import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default("");
const optionalNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : Number.NaN;
  })
  .refine((value) => value === null || Number.isFinite(value), "Enter a valid number.");

export const assessmentInputSchema = z.object({
  clientId: z.string().min(1),
  assessmentId: z.string().uuid().optional().nullable(),
  status: z.enum(["DRAFT", "COMPLETE"]),
  experienceLevel: z.string().trim().min(2).max(80),
  primaryGoal: z.string().trim().min(3).max(500),
  secondaryGoals: optionalText(1000),
  injuriesLimitations: optionalText(2000),
  medicalNotes: optionalText(2000),
  baselineSummary: optionalText(2000),
  consentAcknowledged: z.boolean(),
});

export const goalInputSchema = z.object({
  clientId: z.string().min(1),
  goalId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3).max(160),
  description: optionalText(1000),
  metricType: optionalText(80),
  baselineValue: optionalNumber,
  targetValue: optionalNumber,
  currentValue: optionalNumber,
  unit: optionalText(30),
  targetDate: z.string().date().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "ACHIEVED", "PAUSED", "CANCELED"]),
});

export const programInputSchema = z
  .object({
    clientId: z.string().min(1),
    programId: z.string().uuid().optional().nullable(),
    name: z.string().trim().min(3).max(160),
    goalSummary: optionalText(1000),
    status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]),
    startsAt: z.string().date(),
    endsAt: z.string().date().optional().or(z.literal("")),
  })
  .refine(
    (value) => !value.endsAt || value.endsAt >= value.startsAt,
    { message: "Program end date cannot be before the start date.", path: ["endsAt"] }
  );

export const programWorkoutInputSchema = z.object({
  clientId: z.string().min(1),
  programId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  dayOrder: z.coerce.number().int().min(1).max(30),
  notes: optionalText(1000),
});

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  instructions: optionalText(2000),
  defaultUnit: optionalText(30),
});

export const prescriptionInputSchema = z.object({
  clientId: z.string().min(1),
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  orderIndex: z.coerce.number().int().min(1).max(100),
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.string().trim().min(1).max(40),
  targetLoad: optionalNumber,
  loadUnit: optionalText(20),
  tempo: optionalText(40),
  restSeconds: optionalNumber.refine(
    (value) => value === null || (Number.isInteger(value) && value >= 0),
    "Rest must be a whole number of seconds."
  ),
  notes: optionalText(500),
});

export const progressMetricInputSchema = z.object({
  clientId: z.string().min(1),
  metricType: z.string().trim().min(2).max(80),
  value: z.coerce.number().finite(),
  unit: z.string().trim().min(1).max(30),
  measuredAt: z.string().datetime().optional(),
  note: optionalText(500),
});

export const workoutPerformanceInputSchema = z.object({
  clientId: z.string().min(1),
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.coerce.number().int().min(1).max(100),
  reps: z.coerce.number().nonnegative(),
  load: z.coerce.number().nonnegative(),
  loadUnit: z.string().trim().min(1).max(20),
  rpe: z.coerce.number().min(1).max(10),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  sessionRpe: z.coerce.number().int().min(1).max(10),
  notes: optionalText(1000),
});

export const checkInResponseInputSchema = z.object({
  clientId: z.string().min(1),
  checkInId: z.string().uuid(),
  coachResponse: z.string().trim().min(2).max(2000),
});

export const clientCheckInInputSchema = z
  .object({
    sleepQuality: z.coerce.number().int().min(1).max(5),
    energyLevel: z.coerce.number().int().min(1).max(5),
    sorenessLevel: z.coerce.number().int().min(1).max(5),
    stressLevel: z.coerce.number().int().min(1).max(5),
    painPresent: z.boolean(),
    painDetails: optionalText(1000),
    memberNote: optionalText(2000),
  })
  .refine((value) => !value.painPresent || value.painDetails.length > 0, {
    message: "Describe where you feel pain.",
    path: ["painDetails"],
  });
