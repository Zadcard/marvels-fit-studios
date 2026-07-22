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
  sourceType: "client" | "other";
  clientId?: string;
  sourceLabel?: string;
  amount: number;
  method: "Cash" | "Visa" | "InstaPay";
  note?: string;
  occurredAt: string;
};

export async function recordCashIn(input: RecordCashInInput) {
  const user = await requireRole(UserRole.ADMIN);

  const clientId = input.clientId?.trim() || "";
  const sourceLabel = input.sourceLabel?.trim() || "";
  if (input.sourceType === "client" && !clientId) throw new Error("Choose a client for the cash in.");
  if (input.sourceType === "other" && sourceLabel.length < 2) throw new Error("Write where this cash came from.");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Enter a valid cash in amount.");
  }
  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("Enter a valid date for the cash in.");
  }
  const method =
    input.method === "InstaPay" ? "INSTA_PAY" : input.method === "Visa" ? "VISA" : "CASH";

  const supabase = getSupabaseServerClient();
  const { error } = input.sourceType === "client"
    ? await supabase.from("Payment").insert({
        amount: input.amount,
        currency: "EGP",
        date: occurredAt.toISOString(),
        note: input.note?.trim() || "Cash in recorded from the reports dashboard.",
        clientId,
        method,
      })
    : await supabase.rpc("record_studio_income", {
        p_amount: input.amount,
        p_created_by_id: user.id,
        p_currency: "EGP",
        p_method: method,
        p_note: input.note?.trim() || "",
        p_occurred_at: occurredAt.toISOString(),
        p_source_label: sourceLabel,
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
