"use server";

import { revalidatePath } from "next/cache";
import { TrainingSessionStatus, UserRole } from "@/lib/supabase/domain";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

const saveCoachSessionNoteSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  content: z
    .string()
    .trim()
    .min(1, "Session note cannot be empty.")
    .max(1000, "Session note must be 1000 characters or fewer."),
});

function revalidateSessionNoteViews() {
  revalidatePath("/coach");
  revalidatePath("/coach/sessions");
  revalidatePath("/coach/schedule");
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/schedule");
}

export async function saveCoachSessionNote(
  trainingSessionId: string,
  content: string
) {
  const user = await requireRole(UserRole.COACH);
  const parsed = saveCoachSessionNoteSchema.safeParse({
    trainingSessionId,
    content,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid session note.");
  }

  const prisma = getPrisma();
  const session = await prisma.trainingSession.findFirst({
    where: {
      id: parsed.data.trainingSessionId,
      coach: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!session) {
    throw new Error("You can only write notes for your own sessions.");
  }

  if (session.status === TrainingSessionStatus.CANCELED) {
    throw new Error("Canceled sessions cannot receive new notes.");
  }

  const existingNote = await prisma.sessionNote.findFirst({
    where: {
      trainingSessionId: session.id,
      authorId: user.id,
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
    },
  });

  if (existingNote) {
    await prisma.sessionNote.update({
      where: { id: existingNote.id },
      data: {
        content: parsed.data.content,
      },
    });
  } else {
    await prisma.sessionNote.create({
      data: {
        trainingSessionId: session.id,
        authorId: user.id,
        content: parsed.data.content,
      },
    });
  }

  revalidateSessionNoteViews();

  return {
    content: parsed.data.content,
  };
}
