"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { updateSessionAttendance } from "@/lib/services/attendance-service";
import { updateSessionAttendanceSchema } from "@/lib/validators/session-booking";

function revalidateAttendanceViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}

export async function markAttendance(
  trainingSessionId: string,
  clientId: string,
  status: "BOOKED" | "ATTENDED" | "MISSED" | "WAITLIST"
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
