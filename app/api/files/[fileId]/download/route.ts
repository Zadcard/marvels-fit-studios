import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@/lib/supabase/domain";

import { requireUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/files/[fileId]/download">
) {
  const user = await requireUser();
  const { fileId } = await context.params;
  const supabase = getSupabaseServerClient();

  const { data: file, error } = await supabase
    .from("File")
    .select(
      "id,name,mimeType,data,expiresAt,deletedAt,clientId,groupId,uploadedById,client:Client(userId),group:Group(clients:Client(userId),coach:Coach(userId))"
    )
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;

  if (
    !file ||
    !file.data ||
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

  const { error: updateError } = await supabase
    .from("File")
    .update({ downloadedAt: new Date().toISOString() })
    .eq("id", file.id);
  if (updateError) throw updateError;

  return new Response(file.data, {
    headers: {
      "Content-Type": file.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
