"use server";

import bcrypt from "bcryptjs";
import {
  ClientLifecycleStatus,
  ClientPaymentStatus,
  UserRole,
} from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clientIdGenerator } from "@/lib/services/client-id-generator";
import { passwordGenerator } from "@/lib/services/password-generator";

type SaveAdminClientInput = {
  clientId?: string | null;
  fullName: string;
  email?: string;
  phone?: string;
  status: "Active" | "Pending" | "Paused";
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
  groupId?: string;
};

type DeleteAdminClientInput = {
  clientId: string;
  confirmationText: string;
};

function toClientStatus(
  status: SaveAdminClientInput["status"],
): ClientLifecycleStatus {
  switch (status) {
    case "Active":
      return ClientLifecycleStatus.ACTIVE;
    case "Paused":
      return ClientLifecycleStatus.PAUSED;
    default:
      return ClientLifecycleStatus.PENDING;
  }
}

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
  const status = toClientStatus(input.status);
  const paymentStatus = toPaymentStatus(input.paymentStatus);
  const amount = parseAmount(input.paymentAmount);
  const groupId = input.groupId?.trim() || null;

  if (!fullName) {
    throw new Error("Client full name is required.");
  }

  const generatedClientId = input.clientId
    ? null
    : await generateUniqueClientId();
  const password = generatedClientId
    ? await bcrypt.hash(
        passwordGenerator.generatePassword(generatedClientId),
        12,
      )
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
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
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
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
  revalidatePath("/coach/clients");
  revalidatePath("/coach/sessions");
  revalidatePath("/client");
  revalidatePath("/client/sessions");
}
