"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateRecurringSessionsSchema,
  recurringSessionTemplateIdSchema,
  recurringSessionTemplateSchema,
  type RecurringSessionTemplateInput,
} from "@/lib/validators/recurring-session";

function revalidateRecurringViews() {
  revalidatePath("/admin/groups");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/schedule");
}

export async function saveRecurringSessionTemplate(
  input: RecurringSessionTemplateInput & { templateId?: string | null },
) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = recurringSessionTemplateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid template.");

  const value = parsed.data;
  const record = {
      title: value.title,
      description: value.description || null,
      type: value.type,
      coachId: value.coachId,
      groupId: value.groupId || null,
      location: value.location || null,
      capacity: value.type === "PRIVATE" ? 1 : value.capacity,
      weekday: value.weekday,
      localStartTime: value.localStartTime,
      durationMinutes: value.durationMinutes,
      startsOn: value.startsOn,
      endsOn: value.endsOn || null,
  };
  const templateId = input.templateId
    ? recurringSessionTemplateIdSchema.parse(input.templateId)
    : null;
  const query = templateId
    ? getSupabaseServerClient()
        .from("RecurringSessionTemplate")
        .update(record)
        .eq("id", templateId)
    : getSupabaseServerClient()
        .from("RecurringSessionTemplate")
        .insert({ ...record, createdById: user.id });
  const { data, error } = await query
    .select("id")
    .single();
  if (error) throw error;
  revalidateRecurringViews();
  return data;
}

export async function generateRecurringSessions(input: {
  templateId: string;
  throughDate: string;
}) {
  await requireRole(UserRole.ADMIN);
  const parsed = generateRecurringSessionsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid date.");
  const { data, error } = await getSupabaseServerClient().rpc(
    "generate_recurring_sessions",
    { p_template_id: parsed.data.templateId, p_through_date: parsed.data.throughDate },
  );
  if (error) {
    if (error.code === "23P01") {
      throw new Error(
        "One or more generated sessions overlap another active session for this coach.",
      );
    }
    throw new Error("Recurring sessions could not be generated.");
  }
  revalidateRecurringViews();
  return { generated: data };
}

export async function setRecurringTemplateActive(templateId: string, active: boolean) {
  await requireRole(UserRole.ADMIN);
  const parsedId = recurringSessionTemplateIdSchema.safeParse(templateId);
  if (!parsedId.success) throw new Error("Invalid template id.");
  const { error } = await getSupabaseServerClient()
    .from("RecurringSessionTemplate")
    .update({ active })
    .eq("id", parsedId.data);
  if (error) throw new Error("The recurring series could not be updated.");
  revalidateRecurringViews();
}

export async function deleteRecurringSessionTemplate(templateId: string) {
  await requireRole(UserRole.ADMIN);
  const parsedId = recurringSessionTemplateIdSchema.safeParse(templateId);
  if (!parsedId.success) throw new Error("Invalid template id.");
  const { error } = await getSupabaseServerClient().rpc(
    "delete_recurring_session_template",
    { p_template_id: parsedId.data },
  );
  if (error) {
    if (error.message.includes("generated occurrences")) {
      throw new Error(
        "This series already has generated occurrences. Pause it instead of deleting it.",
      );
    }
    throw error;
  }
  revalidateRecurringViews();
}
