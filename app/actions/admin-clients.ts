"use server";

import { ClientPaymentStatus, UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { COACH_FILES_BUCKET } from "@/lib/storage/coach-files";
import {
  injuryStatusFromLabel,
  lifecycleStatusFromLabel,
  trialOutcomeFromLabel,
} from "@/lib/dashboard/client-domain-labels";

type SaveAdminClientInput = {
  clientId?: string | null;
  fullName: string;
  email?: string;
  phone?: string;
  status: string;
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
  groupId?: string;
  categoryId?: string;
  sport?: string;
  injuryStatus?: string;
  injuryNotes?: string;
  restrictions?: string;
  trialOutcome?: string;
};

type DeleteAdminClientInput = {
  clientId: string;
  confirmationText: string;
};

function toPaymentStatus(
  status: SaveAdminClientInput["paymentStatus"],
): ClientPaymentStatus {
  switch (status) {
    case "Paid":
      return ClientPaymentStatus.PAID;
    case "Due soon":
      return ClientPaymentStatus.DUE_SOON;
    default:
      return ClientPaymentStatus.UNPAID;
  }
}

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function normalizeEmail(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export async function saveAdminClient(input: SaveAdminClientInput) {
  await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() || null;
  const status = lifecycleStatusFromLabel(input.status);
  const paymentStatus = toPaymentStatus(input.paymentStatus);
  const amount = parseAmount(input.paymentAmount);
  const groupId = input.groupId?.trim() || null;
  const categoryId = input.categoryId?.trim() || null;
  const sport = input.sport?.trim() || null;
  const injuryStatus = injuryStatusFromLabel(input.injuryStatus ?? "");
  const injuryNotes = input.injuryNotes?.trim() || null;
  const restrictions = input.restrictions?.trim() || null;
  const trialOutcome = trialOutcomeFromLabel(input.trialOutcome ?? "");

  if (!fullName) {
    throw new Error("Client full name is required.");
  }
  if (!categoryId) {
    throw new Error("Choose an active training category.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("TrainingCategory")
    .select("id,legacyValue,isActive")
    .eq("id", categoryId)
    .maybeSingle();
  if (categoryError) throw categoryError;
  if (!category?.isActive) throw new Error("That training category is no longer active.");

  if (groupId) {
    const { data: group, error: groupError } = await supabase
      .from("Group")
      .select("id,categoryId,isActive")
      .eq("id", groupId)
      .maybeSingle();
    if (groupError) throw groupError;
    if (!group?.isActive) throw new Error("That group is no longer active.");
    if (group.categoryId !== categoryId) {
      throw new Error("Choose a group from the selected training category.");
    }
  }

  const { data: savedClientId, error } = await supabase.rpc(
    "admin_save_client",
    {
      payload: {
        clientId: input.clientId ?? null,
        fullName,
        email,
        phone,
        status,
        paymentStatus,
        amount,
        groupId,
        trainingCategory: category.legacyValue ?? "GENERAL_FITNESS",
        sport,
        injuryStatus,
        injuryNotes,
        restrictions,
        trialOutcome,
      },
    },
  );
  if (error) throw error;

  if (!savedClientId) {
    throw new Error("Client record could not be resolved after save.");
  }

  const { error: relationError } = await supabase
    .from("Client")
    .update({ categoryId })
    .eq("id", savedClientId);
  if (relationError) throw relationError;

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
  revalidatePath("/ops");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
}

export async function deleteAdminClient(input: DeleteAdminClientInput) {
  await requireRole(UserRole.ADMIN);

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm client deletion.');
  }

  const supabase = getSupabaseServerClient();

  const { data: clientFiles, error: filesError } = await supabase
    .from("File")
    .select("path")
    .eq("clientId", input.clientId);
  if (filesError) throw filesError;

  const { error } = await supabase.rpc("admin_delete_client", {
    target_client_id: input.clientId,
  });
  if (error) throw error;

  if (clientFiles.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(COACH_FILES_BUCKET)
      .remove(clientFiles.map((file) => file.path));
    if (storageError) {
      console.error(
        "[admin-clients] failed to remove storage objects for a deleted client:",
        storageError,
      );
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
  revalidatePath("/ops");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
}

