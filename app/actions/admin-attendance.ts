"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import {
  bulkUpdateSessionAttendance,
  updateSessionAttendance,
} from "@/lib/services/attendance-service";
import {
  bulkUpdateSessionAttendanceSchema,
  updateSessionAttendanceSchema,
} from "@/lib/validators/session-booking";

function revalidateAttendanceViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
}

export async function markAttendance(
  trainingSessionId: string,
  clientId: string,
  status:
    | "BOOKED"
    | "ATTENDED"
    | "MISSED"
    | "WAITLIST"
    | "CANCELED"
    | "NO_SHOW"
    | "RESCHEDULED"
) {
  await requireRole(UserRole.ADMIN);

  const parsed = updateSessionAttendanceSchema.safeParse({
    trainingSessionId,
    clientId,
    status,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid attendance details.");
  }

  await updateSessionAttendance(parsed.data);
  revalidateAttendanceViews();
}

export async function markAllAttendance(
  trainingSessionId: string,
  clientIds: string[],
  status:
    | "BOOKED"
    | "ATTENDED"
    | "MISSED"
    | "WAITLIST"
    | "CANCELED"
    | "NO_SHOW"
    | "RESCHEDULED",
) {
  await requireRole(UserRole.ADMIN);

  const parsed = bulkUpdateSessionAttendanceSchema.safeParse({
    trainingSessionId,
    clientIds,
    status,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid attendance details.");
  }

  await bulkUpdateSessionAttendance(parsed.data);
  revalidateAttendanceViews();
}
