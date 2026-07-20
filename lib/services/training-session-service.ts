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
import {
  findCoachConflicts,
  type ConflictSession,
} from "@/lib/services/schedule-conflicts";
import { parseDurationMinutes } from "@/lib/dashboard/duration-label";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";

function optional(value: string | undefined) {
  return value?.trim() ?? "";
}

const conflictTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

async function getPrivateSessionBufferMinutes() {
  const settings = await adminSettingsRepository.get();
  return parseDurationMinutes(settings.privateSessionBuffer) ?? 0;
}

async function assertNoCoachConflict(
  coachId: string,
  startsAt: string,
  endsAt: string,
  type: TrainingSessionType,
  ignoreSessionId?: string,
) {
  // Fetch the coach's non-canceled sessions that could overlap the window
  // (widened by the configured private-session buffer so near-misses are
  // caught too), then confirm with the pure overlap check. A coach in two
  // places at once is a hard conflict (studio-space clashes, by contrast,
  // are allowed).
  const bufferMinutes = await getPrivateSessionBufferMinutes();
  const bufferMs = bufferMinutes * 60_000;
  const windowStart = new Date(Date.parse(startsAt) - bufferMs).toISOString();
  const windowEnd = new Date(Date.parse(endsAt) + bufferMs).toISOString();
  const { data, error } = await getSupabaseServerClient()
    .from("TrainingSession")
    .select("id,title,startsAt,endsAt,type")
    .eq("coachId", coachId)
    .in("status", ["DRAFT", "SCHEDULED"])
    .lt("startsAt", windowEnd)
    .gt("endsAt", windowStart);
  if (error) mapDatabaseError(error);

  const conflicts = findCoachConflicts(
    { startsAt, endsAt, type },
    (data ?? []) as ConflictSession[],
    ignoreSessionId,
    bufferMinutes,
  );

  if (conflicts.length) {
    const clash = conflicts[0];
    throw new Error(
      `This coach already has "${clash.title}" at ${conflictTimeFormatter.format(new Date(clash.startsAt))}. Pick a different time or coach.`,
    );
  }
}

function mapDatabaseError(error: { code?: string; message: string }): never {
  if (
    error.code === "23P01" ||
    error.message.includes("TrainingSession_coach_active_time_excl")
  ) {
    throw new Error("This coach already has an overlapping active session.");
  }
  const known = [
    "Coach record not found.", "Session record not found.",
    "Canceled sessions cannot be edited.", "Capacity cannot be lower than the current active roster.",
    "Group record not found.", "Use the cancellation operation to cancel sessions.",
    "Only empty draft sessions can be deleted.",
    "Completed sessions cannot be canceled.", "One or more selected sessions were not found.",
    "Selected sessions overlap each other.", "Bulk action is incomplete.",
  ];
  const message = known.find((value) => error.message.includes(value));
  throw new Error(message ?? "Training session operation failed.");
}

async function ensureCoach(coachId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("Coach").select("id").eq("id", coachId).maybeSingle();
  if (error) mapDatabaseError(error);
  if (!data) throw new Error("Coach record not found.");
}

export async function createTrainingSession(input: CreateTrainingSessionInput, createdById: string) {
  await ensureCoach(input.coachId);
  await assertNoCoachConflict(input.coachId, input.startsAt, input.endsAt, input.type);
  const { data, error } = await getSupabaseServerClient().from("TrainingSession").insert({
    title: input.title.trim(), description: optional(input.description) || null,
    type: input.type, status: input.status, coachId: input.coachId,
    groupId: input.groupId || null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    capacity: input.type === TrainingSessionType.PRIVATE ? 1 : null,
    createdById,
  }).select("id").single();
  if (error) mapDatabaseError(error);
  return data;
}

export async function updateTrainingSession(input: UpdateTrainingSessionInput) {
  // Rescheduling must not move a session into a coach double-booking. Ignore the
  // session being edited so it never conflicts with itself.
  await assertNoCoachConflict(
    input.coachId,
    input.startsAt,
    input.endsAt,
    input.type,
    input.sessionId,
  );
  // The RPC maps -1 capacity and an empty location to NULL (and still forces
  // capacity 1 for PRIVATE sessions); both fields are no longer collected.
  const { data, error } = await getSupabaseServerClient().rpc("update_training_session", {
    p_capacity: -1,
    p_coach_id: input.coachId, p_description: optional(input.description),
    p_group_id: input.groupId ?? "",
    p_ends_at: input.endsAt, p_location: "",
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
  const { data, error } = await getSupabaseServerClient().rpc(
    "delete_training_session",
    { p_session_id: input.sessionId },
  );
  if (error) mapDatabaseError(error);
  return data[0];
}

export async function bulkUpdateTrainingSessions(input: BulkUpdateTrainingSessionsInput) {
  const { data, error } = await getSupabaseServerClient().rpc("bulk_update_training_sessions", {
    p_action: input.action,
    p_capacity: -1,
    p_coach_id: input.coachId ?? "",
    p_location: "",
    p_session_ids: input.sessionIds,
  });
  if (error) mapDatabaseError(error);
  return { count: data };
}
