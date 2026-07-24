"use server";

import { UserRole } from "@/lib/supabase/domain";
import { requireAnyRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function saveClientPrivateNote(input: {
  clientId: string;
  noteId?: string | null;
  content: string;
}) {
  const user = await requireAnyRole(UserRole.COACH, UserRole.ADMIN);
  const supabase = getSupabaseServerClient();
  const content = input.content.trim();

  if (!content) {
    throw new Error("Note cannot be empty.");
  }

  if (input.noteId) {
    const { data: note, error: noteError } = await supabase
      .from("ClientCoachNote")
      .select("id")
      .eq("id", input.noteId)
      .eq("clientId", input.clientId)
      .maybeSingle();
    if (noteError) throw noteError;

    if (!note) {
      throw new Error("Private note not found.");
    }

    const { error } = await supabase
      .from("ClientCoachNote")
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
      .from("ClientCoachNote")
      .insert({
        clientId: input.clientId,
        content,
        isPrivate: true,
        authorId: user.id,
      });
    if (error) throw error;
  }
}
