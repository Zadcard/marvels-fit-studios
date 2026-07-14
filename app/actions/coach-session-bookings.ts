"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";
import {
  cancelSessionBooking,
  createSessionBooking,
} from "@/lib/services/session-booking-service";
import {
  cancelSessionBookingSchema,
  createSessionBookingSchema,
} from "@/lib/validators/session-booking";

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
    throw new Error("You can only manage bookings for your own sessions.");
  }
}

function revalidateCoachBookingViews() {
  revalidatePath("/coach");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/client");
  revalidatePath("/client/coach");
  revalidatePath("/client/sessions");
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/sessions");
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
