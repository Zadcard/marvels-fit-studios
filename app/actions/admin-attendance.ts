"use server";

import { revalidatePath } from "next/cache";
import { LeadStatus, UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  revalidatePath("/admin/clients");
  revalidatePath("/admin/join-requests");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/schedule");
  revalidatePath("/ops");
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
}

async function syncLeadTrialDoneOnAttended(clientIds: string[]) {
  if (!clientIds.length) return;
  try {
    const supabase = getSupabaseServerClient();
    await supabase
      .from("Lead")
      .update({ status: LeadStatus.TRIAL_DONE })
      .in("id", clientIds)
      .eq("status", LeadStatus.CONTACTED);

    const { data: clients } = await supabase
      .from("Client")
      .select("phone")
      .in("id", clientIds);

    const phones = (clients || []).map((c) => c.phone).filter((p): p is string => Boolean(p));

    if (phones.length) {
      await supabase
        .from("Lead")
        .update({ status: LeadStatus.TRIAL_DONE })
        .in("phone", phones)
        .eq("status", LeadStatus.CONTACTED);
    }
  } catch (err) {
    console.error("[syncLeadTrialDoneOnAttended] Error syncing trial done status:", err);
  }
}

export async function markAttendance(
  trainingSessionId: string,
  clientId: string,
  status:
    | "BOOKED"
    | "ATTENDED"
    | "LATE"
    | "MISSED"
    | "EXCUSED"
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

  if (status === "ATTENDED" || status === "LATE") {
    await syncLeadTrialDoneOnAttended([clientId]);
  }

  revalidateAttendanceViews();
}

export async function markAllAttendance(
  trainingSessionId: string,
  clientIds: string[],
  status:
    | "BOOKED"
    | "ATTENDED"
    | "LATE"
    | "MISSED"
    | "EXCUSED"
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

  if (status === "ATTENDED" || status === "LATE") {
    await syncLeadTrialDoneOnAttended(clientIds);
  }

  revalidateAttendanceViews();
}
