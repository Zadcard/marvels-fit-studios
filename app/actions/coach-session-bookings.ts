"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import { requireCoachClientAccess } from "@/lib/auth/coach-client-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { updateSessionAttendance } from "@/lib/services/attendance-service";
import {
  cancelSessionBooking,
  createSessionBooking,
} from "@/lib/services/session-booking-service";
import {
  cancelSessionBookingSchema,
  createSessionBookingSchema,
  updateSessionAttendanceSchema,
} from "@/lib/validators/session-booking";

async function requireOwnedSessionForCoach(userId: string, trainingSessionId: string) {
  const { data: session, error } = await getSupabaseServerClient()
    .from("TrainingSession")
    .select("id,coach:Coach!inner(userId)")
    .eq("id", trainingSessionId)
    .eq("coach.userId", userId)
    .maybeSingle();
  if (error) throw error;

  if (!session) {
    throw new Error("You can only manage bookings for your own sessions.");
  }
}

function revalidateCoachBookingViews() {
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/schedule");
}

export async function assignCoachClientToSession(
  trainingSessionId: string,
  clientId: string
) {
  const user = await requireRole(UserRole.COACH);

  const parsed = createSessionBookingSchema.safeParse({
    trainingSessionId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking details.");
  }

  await requireOwnedSessionForCoach(user.id, parsed.data.trainingSessionId);
  await requireCoachClientAccess(user.id, parsed.data.clientId);
  await createSessionBooking(parsed.data);
  revalidateCoachBookingViews();
}

export async function removeCoachClientFromSession(
  trainingSessionId: string,
  clientId: string
) {
  const user = await requireRole(UserRole.COACH);

  const parsed = cancelSessionBookingSchema.safeParse({
    trainingSessionId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking details.");
  }

  await requireOwnedSessionForCoach(user.id, parsed.data.trainingSessionId);
  await cancelSessionBooking(parsed.data);
  revalidateCoachBookingViews();
}

export async function markCoachSessionAttendance(
  trainingSessionId: string,
  clientId: string,
  status: "BOOKED" | "ATTENDED" | "LATE" | "MISSED" | "EXCUSED" | "NO_SHOW",
) {
  const user = await requireRole(UserRole.COACH);
  const parsed = updateSessionAttendanceSchema.safeParse({
    trainingSessionId,
    clientId,
    status,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid attendance details.");
  }

  await requireOwnedSessionForCoach(user.id, parsed.data.trainingSessionId);
  await updateSessionAttendance(parsed.data);
  revalidateCoachBookingViews();
}
