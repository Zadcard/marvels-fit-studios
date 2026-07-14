import "server-only";

import type {
  BulkUpdateTrainingSessionsInput,
  CancelTrainingSessionInput,
  CreateTrainingSessionInput,
  DeleteTrainingSessionInput,
  UpdateTrainingSessionInput,
} from "@/lib/validators/training-session";
import { TrainingSessionType } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function optional(value: string | undefined) {
  return value?.trim() ?? "";
}

function mapDatabaseError(error: { code?: string; message: string }): never {
  const known = [
    "Coach record not found.", "Session record not found.",
    "Canceled sessions cannot be edited.", "Capacity cannot be lower than the current active roster.",
    "Completed sessions cannot be canceled.", "One or more selected sessions were not found.",
    "Selected coach has overlapping sessions in this bulk selection.", "Bulk action is incomplete.",
  ];
  const message = known.find((value) => error.message.includes(value));
  throw new Error(message ?? "Training session operation failed.");
}

async function ensureCoach(coachId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("Coach").select("id").eq("id", coachId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Coach record not found.");
}

export async function createTrainingSession(input: CreateTrainingSessionInput, createdById: string) {
  await ensureCoach(input.coachId);
  const { data, error } = await getSupabaseServerClient().from("TrainingSession").insert({
    title: input.title.trim(), description: optional(input.description) || null,
    type: input.type, status: input.status, coachId: input.coachId,
    location: optional(input.location) || null, startsAt: input.startsAt,
    endsAt: input.endsAt,
    capacity: input.type === TrainingSessionType.PRIVATE ? 1 : input.capacity,
    createdById,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateTrainingSession(input: UpdateTrainingSessionInput) {
  const { data, error } = await getSupabaseServerClient().rpc("update_training_session", {
    p_capacity: input.capacity ?? -1,
    p_coach_id: input.coachId, p_description: optional(input.description),
    p_ends_at: input.endsAt, p_location: optional(input.location),
    p_session_id: input.sessionId, p_starts_at: input.startsAt,
    p_status: input.status, p_title: input.title, p_type: input.type,
  });
  if (error) mapDatabaseError(error);
  return data[0];
}

export async function cancelTrainingSession(input: CancelTrainingSessionInput) {
  const { data, error } = await getSupabaseServerClient().rpc("cancel_training_session", { p_session_id: input.sessionId });
  if (error) mapDatabaseError(error);
  return data[0];
}

export async function deleteTrainingSession(input: DeleteTrainingSessionInput) {
  const { data, error } = await getSupabaseServerClient().from("TrainingSession")
    .delete().eq("id", input.sessionId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Session record not found.");
  return data;
}

export async function bulkUpdateTrainingSessions(input: BulkUpdateTrainingSessionsInput) {
  const { data, error } = await getSupabaseServerClient().rpc("bulk_update_training_sessions", {
    p_action: input.action,
    p_capacity: input.capacity ?? -1,
    p_coach_id: input.coachId ?? "",
    p_location: input.location ?? "",
    p_session_ids: input.sessionIds,
  });
  if (error) mapDatabaseError(error);
  return { count: data };
}
