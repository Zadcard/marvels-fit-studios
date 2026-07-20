"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/domain";
import {
  decideScheduleChangeRequestSchema,
  logScheduleChangeRequestSchema,
  type LogScheduleChangeRequestInput,
} from "@/lib/validators/schedule-change-request";

const knownErrors = [
  "Admin account not found.",
  "Client record not found.",
  "A reason between 2 and 300 characters is required.",
  "A session is required to cancel a booking.",
  "A source and target session are required to move a booking.",
  "A group, from/to weekdays, and an effective date are required.",
  "A current group, a new group, and an effective date are required.",
  "The new group must be different from the current group.",
  "Current group not found.",
  "New group not found.",
  "The target session has already happened or is no longer active.",
  "The target session does not match the source session's training category.",
  "The new group is already at capacity.",
  "Unknown change request kind.",
  "Change request not found.",
  "This request was already decided.",
  "Unknown decision.",
  "Session record not found.",
  "Bookings can only be changed for active sessions.",
  "This client is already assigned to the session.",
  "This session is already at capacity.",
];

function mapError(error: { message: string }): never {
  throw new Error(
    knownErrors.find((message) => error.message.includes(message)) ??
      "The change request could not be processed.",
  );
}

function revalidateScheduleViews() {
  revalidatePath("/admin/schedule");
}

export async function logScheduleChangeRequest(input: LogScheduleChangeRequestInput) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = logScheduleChangeRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid change request.");
  }
  const value = parsed.data;
  const { data, error } = await getSupabaseServerClient().rpc("log_schedule_change_request", {
    p_client_id: value.clientId,
    p_kind: value.kind,
    p_reason: value.reason,
    p_created_by_id: user.id,
    p_source_session_id: value.sourceSessionId,
    p_target_session_id: value.targetSessionId,
    p_group_id: value.groupId,
    p_from_weekdays: value.fromWeekdays,
    p_to_weekdays: value.toWeekdays,
    p_effective_from: value.effectiveFrom,
    p_to_group_id: value.toGroupId,
  });
  if (error) mapError(error);
  revalidateScheduleViews();
  return { id: data as string };
}

export async function decideScheduleChangeRequest(requestId: string, decision: "APPROVED" | "DECLINED") {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = decideScheduleChangeRequestSchema.safeParse({ requestId, decision });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid decision.");
  }
  const { data, error } = await getSupabaseServerClient().rpc("decide_schedule_change_request", {
    p_request_id: parsed.data.requestId,
    p_decision: parsed.data.decision,
    p_decided_by_id: user.id,
  });
  if (error) mapError(error);
  revalidateScheduleViews();
  return { resultSummary: (data as string | null) ?? null };
}
