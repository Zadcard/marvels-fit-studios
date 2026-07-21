"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { trainingCategoryFromLabel } from "@/lib/dashboard/client-domain-labels";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GroupType, TrainingSessionType, UserRole } from "@/lib/supabase/domain";
import { recurringSessionSlotSchema } from "@/lib/validators/recurring-session";
import { z } from "zod";

type SaveAdminGroupSeriesInput = {
  templateId?: string | null;
  durationMinutes: number;
  startsOn: string;
  endsOn?: string;
  slots: Array<{ weekday: number; localStartTime: string }>;
};

type SaveAdminGroupInput = {
  groupId?: string | null;
  name: string;
  groupType: "Group" | "Private";
  trainingCategory: string;
  categoryId?: string; // categoryId foreign key
  coachId: string;
  capacity?: string;
  isActive: boolean;
  notes?: string;
  series?: SaveAdminGroupSeriesInput;
};

const saveAdminGroupSeriesSchema = z
  .object({
    templateId: z.string().uuid().nullish(),
    durationMinutes: z.number().int().min(15).max(480),
    startsOn: z.string().date(),
    endsOn: z.string().date().optional(),
    slots: z.array(recurringSessionSlotSchema).min(1).max(7),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.slots.forEach((slot, index) => {
      const key = `${slot.weekday}:${slot.localStartTime}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["slots", index],
          message: "Each day and time can only appear once in a series.",
        });
      }
      seen.add(key);
    });
  });

type DeleteAdminGroupInput = {
  groupId: string;
  confirmationText: string;
};

type GroupMembershipInput = {
  groupId: string;
  clientId: string;
  action: "add" | "remove";
};

function parseCapacity(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function revalidateGroupViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach");
}

export async function saveAdminGroup(input: SaveAdminGroupInput) {
  const user = await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();

  const name = input.name.trim();
  const coachId = input.coachId.trim();
  const capacity = parseCapacity(input.capacity);
  const notes = input.notes?.trim() || null;
  const trainingCategory = trainingCategoryFromLabel(input.trainingCategory);
  const type = input.groupType === "Private" ? GroupType.PRIVATE : GroupType.GROUP;

  if (!name) {
    throw new Error("Group name is required.");
  }

  if (!coachId) {
    throw new Error("Assign a coach to the group.");
  }

  const series = input.series ? saveAdminGroupSeriesSchema.parse(input.series) : null;

  const { data: groupId, error } = await supabase.rpc("save_admin_group", {
    p_group_id: input.groupId ?? "",
    p_name: name,
    p_type: type,
    p_training_category: trainingCategory,
    p_coach_id: coachId,
    p_capacity: capacity,
    p_is_active: input.isActive,
    p_notes: notes ?? "",
  });
  if (error) {
    if (error.message.includes("lower than current membership")) {
      throw new Error("Group capacity cannot be lower than current membership.");
    }
    throw error;
  }

  if (series) {
    const { error: seriesError } = await supabase.rpc("sync_recurring_session_template", {
      p_template_id: series.templateId ?? null,
      p_title: name,
      p_description: null,
      p_type: type === GroupType.PRIVATE ? TrainingSessionType.PRIVATE : TrainingSessionType.GROUP,
      p_coach_id: coachId,
      p_group_id: groupId as string,
      p_capacity: type === GroupType.PRIVATE ? 1 : capacity,
      p_duration_minutes: series.durationMinutes,
      p_starts_on: series.startsOn,
      p_ends_on: series.endsOn || null,
      p_slots: series.slots,
      p_created_by_id: user.id,
      p_through_date: null,
    });
    if (seriesError) {
      if (seriesError.code === "23P01") {
        throw new Error(
          "One or more generated sessions overlap another active session for this coach.",
        );
      }
      throw seriesError;
    }
  }

  revalidateGroupViews();
  return { id: groupId as string };
}

export async function deleteAdminGroup(input: DeleteAdminGroupInput) {
  await requireRole(UserRole.ADMIN);

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm removing this group.');
  }

  // Client / template / session foreign keys use ON DELETE SET NULL, so removing
  // a group unassigns its members and recurring templates without deleting them.
  const { error } = await getSupabaseServerClient()
    .from("Group")
    .delete()
    .eq("id", input.groupId);
  if (error) throw error;

  revalidateGroupViews();
}

export async function setAdminGroupMembership(input: GroupMembershipInput) {
  await requireRole(UserRole.ADMIN);
  const groupId = input.groupId.trim();
  const clientId = input.clientId.trim();

  if (!groupId || !clientId) {
    throw new Error("Group and client are required.");
  }

  const { error } = await getSupabaseServerClient().rpc(
    "set_admin_group_membership",
    {
      p_group_id: groupId,
      p_client_id: clientId,
      p_action: input.action,
    },
  );
  if (error) {
    if (error.message.includes("already at capacity")) {
      throw new Error("Group is already at capacity.");
    }
    throw error;
  }

  revalidateGroupViews();
}
