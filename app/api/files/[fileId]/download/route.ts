import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@/lib/supabase/domain";

import { requireUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/files/[fileId]/download">
) {
  const user = await requireUser();
  const { fileId } = await context.params;
  const prisma = getPrisma();

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      name: true,
      mimeType: true,
      data: true,
      expiresAt: true,
      deletedAt: true,
      clientId: true,
      groupId: true,
      uploadedById: true,
      client: {
        select: {
          userId: true,
        },
      },
      group: {
        select: {
          clients: {
            select: {
              userId: true,
            },
          },
          coach: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!file || !file.data || file.deletedAt || file.expiresAt <= new Date()) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const canDownload =
    user.role === UserRole.ADMIN ||
    file.uploadedById === user.id ||
    file.client?.userId === user.id ||
    file.group?.coach.userId === user.id ||
    file.group?.clients.some((client) => client.userId === user.id);

  if (!canDownload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  await prisma.file.update({
    where: { id: file.id },
    data: {
      downloadedAt: new Date(),
    },
  });

  return new Response(file.data, {
    headers: {
      "Content-Type": file.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
