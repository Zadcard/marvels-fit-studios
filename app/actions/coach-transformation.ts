"use server";

import { revalidatePath } from "next/cache";

import { requireCoachClientAccess } from "@/lib/auth/coach-client-access";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  assessmentInputSchema,
  checkInResponseInputSchema,
  exerciseInputSchema,
  goalInputSchema,
  prescriptionInputSchema,
  programInputSchema,
  programWorkoutInputSchema,
  progressMetricInputSchema,
  workoutPerformanceInputSchema,
} from "@/lib/validators/transformation";

function revalidateTransformation() {
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
}

function firstIssue(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Invalid transformation data.";
}

export async function saveClientAssessment(
  input: Parameters<typeof assessmentInputSchema.parse>[0]
) {
  const parsed = assessmentInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  await requireCoachClientAccess(user.id, parsed.data.clientId);
  const supabase = getSupabaseServerClient();
  const payload = {
    clientId: parsed.data.clientId,
    assessorId: user.id,
    status: parsed.data.status,
    experienceLevel: parsed.data.experienceLevel,
    primaryGoal: parsed.data.primaryGoal,
    secondaryGoals: parsed.data.secondaryGoals || null,
    injuriesLimitations: parsed.data.injuriesLimitations || null,
    medicalNotes: parsed.data.medicalNotes || null,
    baselineSummary: parsed.data.baselineSummary || null,
    consentAcknowledgedAt: parsed.data.consentAcknowledged
      ? new Date().toISOString()
      : null,
    assessedAt: new Date().toISOString(),
  };

  const result = parsed.data.assessmentId
    ? await supabase
        .from("ClientAssessment")
        .update(payload)
        .eq("id", parsed.data.assessmentId)
        .eq("clientId", parsed.data.clientId)
        .select("id")
        .maybeSingle()
    : await supabase.from("ClientAssessment").insert(payload).select("id").single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error("Assessment not found.");
  revalidateTransformation();
  return result.data.id;
}

export async function saveClientGoal(
  input: Parameters<typeof goalInputSchema.parse>[0]
) {
  const parsed = goalInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  await requireCoachClientAccess(user.id, parsed.data.clientId);
  const supabase = getSupabaseServerClient();
  const payload = {
    clientId: parsed.data.clientId,
    createdById: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    metricType: parsed.data.metricType || null,
    baselineValue: parsed.data.baselineValue,
    targetValue: parsed.data.targetValue,
    currentValue: parsed.data.currentValue,
    unit: parsed.data.unit || null,
    targetDate: parsed.data.targetDate || null,
    status: parsed.data.status,
    achievedAt:
      parsed.data.status === "ACHIEVED" ? new Date().toISOString() : null,
  };

  const result = parsed.data.goalId
    ? await supabase
        .from("ClientGoal")
        .update(payload)
        .eq("id", parsed.data.goalId)
        .eq("clientId", parsed.data.clientId)
        .select("id")
        .maybeSingle()
    : await supabase.from("ClientGoal").insert(payload).select("id").single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error("Goal not found.");
  revalidateTransformation();
  return result.data.id;
}

export async function saveTrainingProgram(
  input: Parameters<typeof programInputSchema.parse>[0]
) {
  const parsed = programInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  const { coach } = await requireCoachClientAccess(user.id, parsed.data.clientId);
  const { data, error } = await getSupabaseServerClient().rpc(
    "save_training_program",
    {
      p_program_id: (parsed.data.programId ?? null) as unknown as string,
      p_client_id: parsed.data.clientId,
      p_coach_id: coach.id,
      p_name: parsed.data.name,
      p_goal_summary: parsed.data.goalSummary,
      p_status: parsed.data.status,
      p_starts_at: parsed.data.startsAt,
      p_ends_at: (parsed.data.endsAt || null) as unknown as string,
    }
  );

  if (error) throw error;
  revalidateTransformation();
  return data;
}

export async function addProgramWorkout(
  input: Parameters<typeof programWorkoutInputSchema.parse>[0]
) {
  const parsed = programWorkoutInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  const { coach } = await requireCoachClientAccess(user.id, parsed.data.clientId);
  const supabase = getSupabaseServerClient();
  const { data: program, error: programError } = await supabase
    .from("TrainingProgram")
    .select("id")
    .eq("id", parsed.data.programId)
    .eq("clientId", parsed.data.clientId)
    .eq("coachId", coach.id)
    .maybeSingle();
  if (programError) throw programError;
  if (!program) throw new Error("Program not found.");

  const { data, error } = await supabase
    .from("ProgramWorkout")
    .insert({
      programId: parsed.data.programId,
      title: parsed.data.title,
      dayOrder: parsed.data.dayOrder,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidateTransformation();
  return data.id;
}

export async function createExercise(
  input: Parameters<typeof exerciseInputSchema.parse>[0]
) {
  const parsed = exerciseInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  const { data, error } = await getSupabaseServerClient()
    .from("Exercise")
    .insert({
      name: parsed.data.name,
      category: parsed.data.category,
      instructions: parsed.data.instructions || null,
      defaultUnit: parsed.data.defaultUnit || null,
      createdById: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/coach/clients");
  return data.id;
}

export async function addWorkoutExercise(
  input: Parameters<typeof prescriptionInputSchema.parse>[0]
) {
  const parsed = prescriptionInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  const { coach } = await requireCoachClientAccess(user.id, parsed.data.clientId);
  const supabase = getSupabaseServerClient();
  const { data: workout, error: workoutError } = await supabase
    .from("ProgramWorkout")
    .select("id,program:TrainingProgram(clientId,coachId)")
    .eq("id", parsed.data.workoutId)
    .maybeSingle();
  if (workoutError) throw workoutError;
  if (
    !workout ||
    workout.program.clientId !== parsed.data.clientId ||
    workout.program.coachId !== coach.id
  ) {
    throw new Error("Workout not found.");
  }

  const { error } = await supabase.from("WorkoutExercise").insert({
    workoutId: parsed.data.workoutId,
    exerciseId: parsed.data.exerciseId,
    orderIndex: parsed.data.orderIndex,
    sets: parsed.data.sets,
    reps: parsed.data.reps,
    targetLoad: parsed.data.targetLoad,
    loadUnit: parsed.data.loadUnit || null,
    tempo: parsed.data.tempo || null,
    restSeconds: parsed.data.restSeconds,
    notes: parsed.data.notes || null,
  });
  if (error) throw error;
  revalidateTransformation();
}

export async function addProgressMetric(
  input: Parameters<typeof progressMetricInputSchema.parse>[0]
) {
  const parsed = progressMetricInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  await requireCoachClientAccess(user.id, parsed.data.clientId);
  const { error } = await getSupabaseServerClient()
    .from("ProgressMetric")
    .insert({
      clientId: parsed.data.clientId,
      recordedById: user.id,
      metricType: parsed.data.metricType,
      value: parsed.data.value,
      unit: parsed.data.unit,
      measuredAt: parsed.data.measuredAt ?? new Date().toISOString(),
      note: parsed.data.note || null,
    });
  if (error) throw error;
  revalidateTransformation();
}

export async function recordWorkoutPerformance(
  input: Parameters<typeof workoutPerformanceInputSchema.parse>[0]
) {
  const parsed = workoutPerformanceInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  await requireCoachClientAccess(user.id, parsed.data.clientId);
  const supabase = getSupabaseServerClient();
  const { data: prescription, error: prescriptionError } = await supabase
    .from("WorkoutExercise")
    .select("id")
    .eq("workoutId", parsed.data.workoutId)
    .eq("exerciseId", parsed.data.exerciseId)
    .maybeSingle();
  if (prescriptionError) throw prescriptionError;
  if (!prescription) throw new Error("Exercise is not prescribed in this workout.");

  const { data, error } = await supabase.rpc("record_workout_performance", {
    p_client_id: parsed.data.clientId,
    p_program_workout_id: parsed.data.workoutId,
    p_recorded_by_id: user.id,
    p_exercise_id: parsed.data.exerciseId,
    p_set_number: parsed.data.setNumber,
    p_reps: parsed.data.reps,
    p_load: parsed.data.load,
    p_load_unit: parsed.data.loadUnit,
    p_rpe: parsed.data.rpe,
    p_duration_minutes: parsed.data.durationMinutes,
    p_session_rpe: parsed.data.sessionRpe,
    p_notes: parsed.data.notes,
  });
  if (error) throw error;
  revalidateTransformation();
  return data;
}

export async function respondToClientCheckIn(
  input: Parameters<typeof checkInResponseInputSchema.parse>[0]
) {
  const parsed = checkInResponseInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));

  const user = await requireRole(UserRole.COACH);
  await requireCoachClientAccess(user.id, parsed.data.clientId);
  const { data, error } = await getSupabaseServerClient()
    .from("ClientCheckIn")
    .update({
      coachResponse: parsed.data.coachResponse,
      respondedById: user.id,
      respondedAt: new Date().toISOString(),
    })
    .eq("id", parsed.data.checkInId)
    .eq("clientId", parsed.data.clientId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Check-in not found.");
  revalidateTransformation();
}
