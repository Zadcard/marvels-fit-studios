"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import {
  cancelTrainingSession,
  createTrainingSession,
  deleteTrainingSession,
  updateTrainingSession,
} from "@/lib/services/training-session-service";
import {
  cancelTrainingSessionSchema,
  createTrainingSessionSchema,
  deleteTrainingSessionSchema,
  updateTrainingSessionSchema,
} from "@/lib/validators/training-session";

type SaveAdminSessionInput = {
  sessionId?: string | null;
  title: string;
  description?: string;
  type: "GROUP" | "PRIVATE";
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  coachId: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
};

function revalidateSessionViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}

export async function saveAdminSession(input: SaveAdminSessionInput) {
  const user = await requireRole(UserRole.ADMIN);

  if (input.sessionId) {
    const parsed = updateTrainingSessionSchema.safeParse({
      sessionId: input.sessionId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status,
      coachId: input.coachId,
      location: input.location,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid session details.");
    }

    await updateTrainingSession(parsed.data);
  } else {
    const parsed = createTrainingSessionSchema.safeParse(input);

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid session details.");
    }

    await createTrainingSession(parsed.data, user.id);
  }

  revalidateSessionViews();
}

export async function cancelAdminSession(sessionId: string) {
  await requireRole(UserRole.ADMIN);

  const parsed = cancelTrainingSessionSchema.safeParse({ sessionId });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid session id.");
  }

  await cancelTrainingSession(parsed.data);
  revalidateSessionViews();
}

export async function deleteAdminSession(sessionId: string) {
  await requireRole(UserRole.ADMIN);

  const parsed = deleteTrainingSessionSchema.safeParse({ sessionId });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid session id.");
  }

  await deleteTrainingSession(parsed.data);
  revalidateSessionViews();
}
