"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/domain";

const recordExpenseSchema = z.object({
  amount: z.coerce.number().positive("Expense amount must be positive.").max(10_000_000),
  currency: z.string().trim().length(3).default("EGP"),
  category: z.enum(["SUPPLIES", "MAINTENANCE", "COACH_PAYMENT", "RENT_UTILITIES", "MARKETING", "OTHER"]),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "INSTAPAY"]),
  description: z.string().trim().min(2).max(300),
  reference: z.string().trim().max(120).optional(),
  occurredAt: z.iso.datetime(),
});

const voidExpenseSchema = z.object({
  expenseId: z.uuid(),
  reason: z.string().trim().min(2).max(300),
});

function revalidateExpenseViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/subscriptions");
}

export async function recordStudioExpense(input: z.input<typeof recordExpenseSchema>) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = recordExpenseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid expense details.");
  }
  const value = parsed.data;
  const { data, error } = await getSupabaseServerClient().rpc("record_studio_expense", {
    p_amount: value.amount,
    p_category: value.category,
    p_created_by_id: user.id,
    p_currency: value.currency.toUpperCase(),
    p_description: value.description,
    p_occurred_at: value.occurredAt,
    p_payment_method: value.paymentMethod,
    p_reference: value.reference ?? "",
  });
  if (error) {
    const known = ["Expense amount must be positive.", "Expense description must be 2 to 300 characters.", "Expense date cannot be in the future."];
    throw new Error(known.find((message) => error.message.includes(message)) ?? "The expense could not be recorded.");
  }
  revalidateExpenseViews();
  return { id: data };
}

export async function voidStudioExpense(expenseId: string, reason: string) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = voidExpenseSchema.safeParse({ expenseId, reason });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid void details.");
  }
  const { error } = await getSupabaseServerClient().rpc("void_studio_expense", {
    p_expense_id: parsed.data.expenseId,
    p_reason: parsed.data.reason,
    p_voided_by_id: user.id,
  });
  if (error) {
    const known = ["Expense record not found.", "Expense is already void.", "Void reason must be 2 to 300 characters."];
    throw new Error(known.find((message) => error.message.includes(message)) ?? "The expense could not be voided.");
  }
  revalidateExpenseViews();
}
