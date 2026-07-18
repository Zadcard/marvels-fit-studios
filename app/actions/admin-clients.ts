"use server";

import bcrypt from "bcryptjs";
import { ClientPaymentStatus, UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { generateTemporaryPassword } from "@/lib/auth/temporary-password";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clientIdGenerator } from "@/lib/services/client-id-generator";
import {
  injuryStatusFromLabel,
  lifecycleStatusFromLabel,
  trainingCategoryFromLabel,
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
  trainingCategory?: string;
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

async function generateUniqueClientId() {
  const supabase = getSupabaseServerClient();
  const firstCandidate = await clientIdGenerator.getNextAvailableSlot();

  for (let offset = 0; offset < 1200; offset += 1) {
    const baseDate = new Date(
      firstCandidate.year,
      firstCandidate.month - 1 + offset,
      1,
    );
    const slot = await clientIdGenerator.getNextAvailableSlot(
      baseDate.getMonth() + 1,
      baseDate.getFullYear(),
    );
    const candidate = clientIdGenerator.generateId(slot);
    const { data: existing, error } = await supabase
      .from("User")
      .select("id")
      .eq("clientId", candidate)
      .maybeSingle();
    if (error) throw error;

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique client ID. Please try again.");
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
  const trainingCategory = trainingCategoryFromLabel(input.trainingCategory ?? "");
  const sport = input.sport?.trim() || null;
  const injuryStatus = injuryStatusFromLabel(input.injuryStatus ?? "");
  const injuryNotes = input.injuryNotes?.trim() || null;
  const restrictions = input.restrictions?.trim() || null;
  const trialOutcome = trialOutcomeFromLabel(input.trialOutcome ?? "");

  if (!fullName) {
    throw new Error("Client full name is required.");
  }

  const generatedClientId = input.clientId
    ? null
    : await generateUniqueClientId();
  const temporaryPassword = generatedClientId
    ? generateTemporaryPassword()
    : null;
  const password = temporaryPassword
    ? await bcrypt.hash(temporaryPassword, 12)
    : null;
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
        trainingCategory,
        sport,
        injuryStatus,
        injuryNotes,
        restrictions,
        trialOutcome,
        loginClientId: generatedClientId,
        password,
      },
    },
  );
  if (error) throw error;

  if (!savedClientId) {
    throw new Error("Client record could not be resolved after save.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");

  return {
    credentials:
      generatedClientId && temporaryPassword
        ? {
            signInId: generatedClientId,
            temporaryPassword,
          }
        : null,
  };
}

export async function deleteAdminClient(input: DeleteAdminClientInput) {
  await requireRole(UserRole.ADMIN);

  if (input.confirmationText.trim() !== "Delete") {
    throw new Error('Type "Delete" to confirm client deletion.');
  }

  const { error } = await getSupabaseServerClient().rpc("admin_delete_client", {
    target_client_id: input.clientId,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
}
