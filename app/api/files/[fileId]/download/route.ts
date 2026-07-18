import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@/lib/supabase/domain";

import { getRouteUserOrNull } from "@/lib/auth/route-user";
import { attachmentContentDisposition } from "@/lib/http/content-disposition";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { COACH_FILES_BUCKET } from "@/lib/storage/coach-files";
import { isUuid } from "@/lib/validators/uuid";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/files/[fileId]/download">
) {
  const user = await getRouteUserOrNull();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }
  const { fileId } = await context.params;
  if (!isUuid(fileId)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  const supabase = getSupabaseServerClient();

  const { data: file, error } = await supabase
    .from("File")
    .select(
      "id,name,path,mimeType,expiresAt,deletedAt,clientId,groupId,uploadedById,client:Client(userId),group:Group(clients:Client(userId),coach:Coach(userId))"
    )
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;

  if (
    !file ||
    file.deletedAt ||
    new Date(file.expiresAt) <= new Date()
  ) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const canDownload =
    user.role === UserRole.ADMIN ||
    file.uploadedById === user.id ||
    file.client?.userId === user.id ||
    file.group?.coach?.userId === user.id ||
    file.group?.clients.some((client) => client.userId === user.id);

  if (!canDownload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { data: storedFile, error: downloadError } = await supabase.storage
    .from(COACH_FILES_BUCKET)
    .download(file.path);
  if (downloadError) {
    if (downloadError.message.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    throw downloadError;
  }

  const { error: updateError } = await supabase
    .from("File")
    .update({ downloadedAt: new Date().toISOString() })
    .eq("id", file.id);
  if (updateError) throw updateError;

  return new Response(storedFile, {
    headers: {
      "Content-Type": file.mimeType ?? "application/octet-stream",
      "Content-Disposition": attachmentContentDisposition(file.name),
      "Cache-Control": "private, no-store",
    },
  });
}
