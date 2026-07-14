"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import {
  cancelSessionBooking,
  createSessionBooking,
} from "@/lib/services/session-booking-service";
import {
  cancelSessionBookingSchema,
  createSessionBookingSchema,
} from "@/lib/validators/session-booking";

function revalidateBookingViews() {
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

export async function assignClientToSession(
  trainingSessionId: string,
  clientId: string
) {
  await requireRole(UserRole.ADMIN);

  const parsed = createSessionBookingSchema.safeParse({
    trainingSessionId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking details.");
  }

  await createSessionBooking(parsed.data);
  revalidateBookingViews();
}

export async function removeClientFromSession(
  trainingSessionId: string,
  clientId: string
) {
  await requireRole(UserRole.ADMIN);

  const parsed = cancelSessionBookingSchema.safeParse({
    trainingSessionId,
    clientId,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking details.");
  }

  await cancelSessionBooking(parsed.data);
  revalidateBookingViews();
}
