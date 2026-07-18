"use server";

import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function saveClientPrivateNote(input: {
  noteId?: string | null;
  content: string;
}) {
  const user = await requireRole(UserRole.CLIENT);
  const supabase = getSupabaseServerClient();
  const content = input.content.trim();

  if (!content) {
    throw new Error("Note cannot be empty.");
  }

  const { data: client, error: clientError } = await supabase
    .from("Client")
    .select("id")
    .eq("userId", user.id)
    .maybeSingle();
  if (clientError) throw clientError;

  if (!client) {
    throw new Error("Client profile not found.");
  }

  if (input.noteId) {
    const { data: note, error: noteError } = await supabase
      .from("WorkoutNote")
      .select("id")
      .eq("id", input.noteId)
      .eq("clientId", client.id)
      .eq("authorId", user.id)
      .eq("isPrivate", true)
      .maybeSingle();
    if (noteError) throw noteError;

    if (!note) {
      throw new Error("Private note not found.");
    }

    const { error } = await supabase
      .from("WorkoutNote")
      .update({
        content,
        date: new Date().toISOString(),
        isPrivate: true,
        authorId: user.id,
      })
      .eq("id", note.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("WorkoutNote")
      .insert({
        clientId: client.id,
        content,
        isPrivate: true,
        authorId: user.id,
      });
    if (error) throw error;
  }

}
