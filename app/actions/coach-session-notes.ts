"use server";

import { revalidatePath } from "next/cache";
import { TrainingSessionStatus, UserRole } from "@/lib/supabase/domain";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

  const supabase = getSupabaseServerClient();
  const { data: session, error: sessionError } = await supabase
    .from("TrainingSession")
    .select("id,status,coach:Coach!inner(userId)")
    .eq("id", parsed.data.trainingSessionId)
    .eq("coach.userId", user.id)
    .maybeSingle();
  if (sessionError) throw sessionError;

  if (!session) {
    throw new Error("You can only write notes for your own sessions.");
  }

  if (session.status === TrainingSessionStatus.CANCELED) {
    throw new Error("Canceled sessions cannot receive new notes.");
  }

  const { data: existingNote, error: noteError } = await supabase
    .from("SessionNote")
    .select("id")
    .eq("trainingSessionId", session.id)
    .eq("authorId", user.id)
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (noteError) throw noteError;

  if (existingNote) {
    const { error } = await supabase
      .from("SessionNote")
      .update({ content: parsed.data.content })
      .eq("id", existingNote.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("SessionNote")
      .insert({
        trainingSessionId: session.id,
        authorId: user.id,
        content: parsed.data.content,
      });
    if (error) throw error;
  }

  revalidateSessionNoteViews();

  return {
    content: parsed.data.content,
  };
}
