"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";
import { cancelSessionBookingSchema } from "@/lib/validators/session-booking";

type AttendanceStatus = "ATTENDED" | "MISSED";

async function requireOwnedSessionForCoach(userId: string, trainingSessionId: string) {
  const prisma = getPrisma();
  const session = await prisma.trainingSession.findFirst({
    where: {
      id: trainingSessionId,
      coach: {
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    throw new Error("You can only update attendance for your own sessions.");
  }
}

function revalidateCoachAttendanceViews() {
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/sessions");
}

export async function updateCoachAttendance(
  trainingSessionId: string,
  clientId: string,
  status: AttendanceStatus
) {
  const user = await requireRole(UserRole.COACH);

  const parsed = cancelSessionBookingSchema.safeParse({
    trainingSessionId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid attendance details.");
  }

  await requireOwnedSessionForCoach(user.id, parsed.data.trainingSessionId);

  const prisma = getPrisma();
  const booking = await prisma.sessionBooking.findUnique({
    where: {
      trainingSessionId_clientId: parsed.data,
    },
    select: {
      id: true,
    },
  });

  if (!booking) {
    throw new Error("Booking record not found.");
  }

  await prisma.sessionBooking.update({
    where: {
      id: booking.id,
    },
    data: {
      status,
      attendedAt: status === "ATTENDED" ? new Date() : null,
    },
  });

  revalidateCoachAttendanceViews();
}
