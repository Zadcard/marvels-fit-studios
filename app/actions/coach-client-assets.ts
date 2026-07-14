"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { requireCoachClientAccess } from "@/lib/auth/coach-client-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  ALLOWED_COACH_FILE_TYPES,
  COACH_FILES_BUCKET,
  createCoachFilePath,
  MAX_COACH_FILE_SIZE,
} from "@/lib/storage/coach-files";

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

  await requireCoachClientAccess(coach.id, clientId);

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

  if (file.size > MAX_COACH_FILE_SIZE) {
    throw new Error("Files must be 10 MB or smaller.");
  }

  if (!ALLOWED_COACH_FILE_TYPES.has(file.type)) {
    throw new Error(
      "Upload a PDF, image, text, Word, or Excel training file."
    );
  }

  if (scope === "client") {
    await requireCoachClientAccess(coach.id, targetId);
  } else if (scope === "group") {
    await assertCoachCanAccessGroup(coach.id, targetId);
  } else {
    throw new Error("Invalid file scope.");
  }

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const bytes = Buffer.from(await file.arrayBuffer());
  const path = createCoachFilePath(scope, targetId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(COACH_FILES_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("File").insert({
    name: file.name,
    path,
    mimeType: file.type,
    size: file.size,
    note: note || null,
    expiresAt: expiresAt.toISOString(),
    uploadedById: coach.id,
    clientId: scope === "client" ? targetId : null,
    groupId: scope === "group" ? targetId : null,
  });
  if (error) {
    const { error: cleanupError } = await supabase.storage
      .from(COACH_FILES_BUCKET)
      .remove([path]);
    if (cleanupError) {
      console.error(
        "[coach-files] failed to remove an orphaned upload:",
        cleanupError
      );
    }
    throw error;
  }

  revalidateClientAssetViews();
}

export async function cleanupExpiredCoachFiles() {
  await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data: expiredFiles, error: findError } = await supabase
    .from("File")
    .select("id,path")
    .lte("expiresAt", now);
  if (findError) throw findError;

  if (expiredFiles.length === 0) {
    return;
  }

  const { error: storageError } = await supabase.storage
    .from(COACH_FILES_BUCKET)
    .remove(expiredFiles.map((file) => file.path));
  if (storageError) throw storageError;

  const { error } = await supabase
    .from("File")
    .delete()
    .in("id", expiredFiles.map((file) => file.id));
  if (error) throw error;

  revalidateClientAssetViews();
}
