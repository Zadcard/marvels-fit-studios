"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

export async function saveClientPrivateNote(input: {
  noteId?: string | null;
  content: string;
}) {
  const user = await requireRole(UserRole.CLIENT);
  const prisma = getPrisma();
  const content = input.content.trim();

  if (!content) {
    throw new Error("Note cannot be empty.");
  }

  const client = await prisma.client.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!client) {
    throw new Error("Client profile not found.");
  }

  if (input.noteId) {
    const note = await prisma.workoutNote.findFirst({
      where: {
        id: input.noteId,
        clientId: client.id,
        authorId: user.id,
        isPrivate: true,
      },
      select: { id: true },
    });

    if (!note) {
      throw new Error("Private note not found.");
    }

    await prisma.workoutNote.update({
      where: { id: note.id },
      data: {
        content,
        date: new Date(),
        isPrivate: true,
        authorId: user.id,
      },
    });
  } else {
    await prisma.workoutNote.create({
      data: {
        clientId: client.id,
        content,
        isPrivate: true,
        authorId: user.id,
      },
    });
  }

  revalidatePath("/client");
}
