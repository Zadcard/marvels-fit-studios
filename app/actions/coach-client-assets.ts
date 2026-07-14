"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function assertCoachCanAccessClient(userId: string, clientId: string) {
  const supabase = getSupabaseServerClient();
  const { data: client, error } = await supabase
    .from("Client")
    .select(
      `
      id, group:Group(coach:Coach(userId)),
      bookings:SessionBooking(trainingSession:TrainingSession(coach:Coach(userId)))
    `,
    )
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;

  if (
    !client ||
    (client.group?.coach.userId !== userId &&
      !client.bookings.some(
        (booking) => booking.trainingSession.coach.userId === userId,
      ))
  ) {
    throw new Error("Client is not assigned to this coach.");
  }
}

async function assertCoachCanAccessGroup(userId: string, groupId: string) {
  const { data: group, error } = await getSupabaseServerClient()
    .from("Group")
    .select("id, coach:Coach(userId)")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;

  if (!group || group.coach.userId !== userId) {
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
  const supabase = getSupabaseServerClient();
  const clientId = input.clientId.trim();
  const content = input.content.trim();

  if (!content) {
    throw new Error("Note cannot be empty.");
  }

  await assertCoachCanAccessClient(coach.id, clientId);

  if (input.noteId) {
    const { data: note, error } = await supabase
      .from("WorkoutNote")
      .select("id, authorId, clientId")
      .eq("id", input.noteId)
      .maybeSingle();
    if (error) throw error;

    if (!note || note.clientId !== clientId) {
      throw new Error("Note not found.");
    }

    if (note.authorId && note.authorId !== coach.id) {
      throw new Error("Only the note author can edit this note.");
    }

    const { error: updateError } = await supabase
      .from("WorkoutNote")
      .update({
        content,
        isPrivate: true,
        authorId: coach.id,
        date: new Date().toISOString(),
      })
      .eq("id", note.id);
    if (updateError) throw updateError;
  } else {
    const { error } = await supabase.from("WorkoutNote").insert({
      clientId,
      content,
      isPrivate: true,
      authorId: coach.id,
    });
    if (error) throw error;
  }

  revalidateClientAssetViews();
}

export async function uploadCoachFile(formData: FormData) {
  const coach = await requireRole(UserRole.COACH);
  const supabase = getSupabaseServerClient();
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

  const { error } = await supabase.from("File").insert({
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    data: `\\x${bytes.toString("hex")}`,
    note: note || null,
    expiresAt: expiresAt.toISOString(),
    uploadedById: coach.id,
    clientId: scope === "client" ? targetId : null,
    groupId: scope === "group" ? targetId : null,
  });
  if (error) throw error;

  revalidateClientAssetViews();
}

export async function cleanupExpiredCoachFiles() {
  await requireRole(UserRole.ADMIN);
  const { error } = await getSupabaseServerClient()
    .from("File")
    .delete()
    .lte("expiresAt", new Date().toISOString());
  if (error) throw error;

  revalidateClientAssetViews();
}
