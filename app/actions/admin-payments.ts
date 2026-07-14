"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SaveClientPaymentInput = {
  clientId: string;
  paymentStatus: "Paid" | "Unpaid" | "Due soon";
  paymentAmount?: string;
};

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export async function saveClientPaymentStatus(input: SaveClientPaymentInput) {
  await requireRole(UserRole.ADMIN);
  const amount = parseAmount(input.paymentAmount);
  if (input.paymentStatus === "Paid" && !amount) {
    throw new Error("Enter a valid payment amount before marking the client paid.");
  }

  const status =
    input.paymentStatus === "Paid"
      ? "PAID"
      : input.paymentStatus === "Due soon"
        ? "DUE_SOON"
        : "UNPAID";
  const { error } = await getSupabaseServerClient().rpc(
    "set_client_payment_status",
    { p_amount: amount ?? 0, p_client_id: input.clientId, p_status: status }
  );
  if (error?.code === "P0002") throw new Error("Client not found.");
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
}
