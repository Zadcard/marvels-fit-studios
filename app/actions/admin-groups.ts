"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { trainingCategoryFromLabel } from "@/lib/dashboard/client-domain-labels";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GroupType, UserRole } from "@/lib/supabase/domain";

type SaveAdminGroupInput = {
  groupId?: string | null;
  name: string;
  groupType: "Group" | "Private";
  trainingCategory: string;
  coachId: string;
  capacity?: string;
  isActive: boolean;
  notes?: string;
};

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
  await requireRole(UserRole.ADMIN);
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

  const { error } = await supabase.rpc("save_admin_group", {
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

  revalidateGroupViews();
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
