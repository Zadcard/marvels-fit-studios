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

type RecordCashInInput = {
  clientId: string;
  amount: number;
  method: "Cash" | "Visa" | "InstaPay";
  note?: string;
  occurredAt: string;
};

export async function recordCashIn(input: RecordCashInInput) {
  await requireRole(UserRole.ADMIN);

  const clientId = input.clientId.trim();
  if (!clientId) throw new Error("Choose a client for the cash in.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Enter a valid cash in amount.");
  }
  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("Enter a valid date for the cash in.");
  }
  const method =
    input.method === "InstaPay" ? "INSTA_PAY" : input.method === "Visa" ? "VISA" : "CASH";

  const { error } = await getSupabaseServerClient().from("Payment").insert({
    amount: input.amount,
    currency: "EGP",
    date: occurredAt.toISOString(),
    note: input.note?.trim() || "Cash in recorded from the reports dashboard.",
    clientId,
    method,
  });
  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/subscriptions");
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
