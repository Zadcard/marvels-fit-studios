"use server";

import { revalidatePath } from "next/cache";

import { requireCategoryWriteAccess, requireGroupWriteAccess } from "@/lib/auth/category-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GroupType, TrainingSessionType } from "@/lib/supabase/domain";
import { nullableRpcString } from "@/lib/supabase/rpc-arguments";
import { databaseTextIdSchema } from "@/lib/validators/database-id";
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
  categoryId: string;
  coachId: string;
  isActive: boolean;
  notes?: string;
  series?: SaveAdminGroupSeriesInput;
  clientIds?: string[];
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

function revalidateGroupViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/schedule");
  revalidatePath("/ops");
  revalidatePath("/coach");
  revalidatePath("/coach/categories");
  revalidatePath("/coach/schedule");
  revalidatePath("/coach/sessions");
}


async function getGroupCategoryId(groupId: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("Group")
    .select("categoryId")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Group record not found.");
  return data.categoryId;
}

export async function saveAdminGroup(input: SaveAdminGroupInput) {
  const supabase = getSupabaseServerClient();

  const name = input.name.trim();
  const coachId = input.coachId.trim();
  const notes = input.notes?.trim() || null;
  const categoryId = input.categoryId.trim();
  const type = input.groupType === "Private" ? GroupType.PRIVATE : GroupType.GROUP;

  if (!name) {
    throw new Error("Group name is required.");
  }

  if (!coachId) {
    throw new Error("Assign a coach to the group.");
  }
  if (!categoryId) {
    throw new Error("Choose a training category.");
  }

  let access;
  if (input.groupId) {
    const existingCategoryId = await getGroupCategoryId(input.groupId);
    const groupAccess = await requireGroupWriteAccess(input.groupId);
    if (categoryId !== existingCategoryId) {
      if (!groupAccess.canEditTimes) {
        throw new Error("Only a supervisor or admin can move a group to a different program.");
      }
      access = { ...(await requireCategoryWriteAccess(categoryId)), canEditTimes: true };
    } else {
      access = groupAccess;
    }
  } else {
    access = { ...(await requireCategoryWriteAccess(categoryId)), canEditTimes: true };
  }

  const series = input.series ? saveAdminGroupSeriesSchema.parse(input.series) : null;
  if (series && !access.canEditTimes) {
    throw new Error("Only a supervisor or admin can change a group's recurring schedule.");
  }
  const clientIds = input.clientIds
    ? z.array(databaseTextIdSchema).max(500).parse([...new Set(input.clientIds)])
    : null;

  const { data: groupId, error } = await supabase.rpc("save_admin_group", {
    p_group_id: input.groupId ?? "",
    p_name: name,
    p_type: type,
    p_category_id: categoryId,
    p_coach_id: coachId,
    p_is_active: input.isActive,
    p_notes: notes ?? "",
  });
  if (error) {
    throw error;
  }

  if (series) {
    const { error: seriesError } = await supabase.rpc("sync_recurring_session_template", {
      p_template_id: nullableRpcString(series.templateId),
      p_title: name,
      p_description: "",
      p_type: type === GroupType.PRIVATE ? TrainingSessionType.PRIVATE : TrainingSessionType.GROUP,
      p_coach_id: coachId,
      p_group_id: groupId as string,
      p_duration_minutes: series.durationMinutes,
      p_starts_on: series.startsOn,
      p_ends_on: nullableRpcString(series.endsOn),
      p_slots: series.slots,
      p_created_by_id: access.userId,
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

  if (clientIds) {
    const { error: membershipError } = await supabase.rpc("sync_group_memberships", {
      p_group_id: groupId as string,
      p_client_ids: clientIds,
    });
    if (membershipError) throw membershipError;
  }

  revalidateGroupViews();
  return { id: groupId as string };
}

export async function deleteAdminGroup(input: DeleteAdminGroupInput) {
  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm removing this group.');
  }

  await requireCategoryWriteAccess(await getGroupCategoryId(input.groupId));

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
  const groupId = input.groupId.trim();
  const clientId = input.clientId.trim();

  if (!groupId || !clientId) {
    throw new Error("Group and client are required.");
  }
  await requireGroupWriteAccess(groupId);

  const { error } = await getSupabaseServerClient().rpc(
    "set_admin_group_membership",
    {
      p_group_id: groupId,
      p_client_id: clientId,
      p_action: input.action,
    },
  );
  if (error) throw error;

  revalidateGroupViews();
}
