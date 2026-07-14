"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function assertCoachCanAccessClient(userId: string, clientId: string) {
  const prisma = getPrisma();
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      OR: [
        {
          group: {
            coach: {
              userId,
            },
          },
        },
        {
          bookings: {
            some: {
              trainingSession: {
                coach: {
                  userId,
                },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    throw new Error("Client is not assigned to this coach.");
  }
}

async function assertCoachCanAccessGroup(userId: string, groupId: string) {
  const prisma = getPrisma();
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      coach: {
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!group) {
    throw new Error("Group is not assigned to this coach.");
  }
}

function revalidateClientAssetViews() {
  revalidatePath("/coach/clients");
  revalidatePath("/client");
}

export async function savePrivateClientNote(input: {
  clientId: string;
  noteId?: string | null;
  content: string;
}) {
  const coach = await requireRole(UserRole.COACH);
  const prisma = getPrisma();
  const clientId = input.clientId.trim();
  const content = input.content.trim();

  if (!content) {
    throw new Error("Note cannot be empty.");
  }

  await assertCoachCanAccessClient(coach.id, clientId);

  if (input.noteId) {
    const note = await prisma.workoutNote.findUnique({
      where: { id: input.noteId },
      select: {
        id: true,
        authorId: true,
        clientId: true,
      },
    });

    if (!note || note.clientId !== clientId) {
      throw new Error("Note not found.");
    }

    if (note.authorId && note.authorId !== coach.id) {
      throw new Error("Only the note author can edit this note.");
    }

    await prisma.workoutNote.update({
      where: { id: note.id },
      data: {
        content,
        isPrivate: true,
        authorId: coach.id,
        date: new Date(),
      },
    });
  } else {
    await prisma.workoutNote.create({
      data: {
        clientId,
        content,
        isPrivate: true,
        authorId: coach.id,
      },
    });
  }

  revalidateClientAssetViews();
}

export async function uploadCoachFile(formData: FormData) {
  const coach = await requireRole(UserRole.COACH);
  const prisma = getPrisma();
  const scope = String(formData.get("scope") ?? "");
  const targetId = String(formData.get("targetId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Choose a file to upload.");
  }

  if (!targetId) {
    throw new Error("Choose a client or group for this file.");
  }

  if (file.size <= 0) {
    throw new Error("File is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Files must be 10 MB or smaller.");
  }

  if (scope === "client") {
    await assertCoachCanAccessClient(coach.id, targetId);
  } else if (scope === "group") {
    await assertCoachCanAccessGroup(coach.id, targetId);
  } else {
    throw new Error("Invalid file scope.");
  }

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const bytes = Buffer.from(await file.arrayBuffer());

  await prisma.file.create({
    data: {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data: bytes,
      note: note || null,
      expiresAt,
      uploadedById: coach.id,
      ...(scope === "client" ? { clientId: targetId } : { groupId: targetId }),
    },
  });

  revalidateClientAssetViews();
}

export async function cleanupExpiredCoachFiles() {
  await requireRole(UserRole.ADMIN);
  await getPrisma().file.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  revalidateClientAssetViews();
}
