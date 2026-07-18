"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateRecurringSessionsSchema,
  recurringSessionTemplateSchema,
  type RecurringSessionTemplateInput,
} from "@/lib/validators/recurring-session";

function revalidateRecurringViews() {
  revalidatePath("/admin/groups");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/schedule");
}

export async function createRecurringSessionTemplate(
  input: RecurringSessionTemplateInput,
) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = recurringSessionTemplateSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid template.");

  const value = parsed.data;
  const { data, error } = await getSupabaseServerClient()
    .from("RecurringSessionTemplate")
    .insert({
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
      createdById: user.id,
    })
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
  if (error) throw error;
  revalidateRecurringViews();
  return { generated: data };
}

export async function setRecurringTemplateActive(templateId: string, active: boolean) {
  await requireRole(UserRole.ADMIN);
  const { error } = await getSupabaseServerClient()
    .from("RecurringSessionTemplate")
    .update({ active })
    .eq("id", templateId);
  if (error) throw error;
  revalidateRecurringViews();
}
