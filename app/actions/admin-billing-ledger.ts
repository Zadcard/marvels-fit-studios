"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/lib/supabase/domain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const adjustmentSchema = z.object({
  clientId: z.string().min(1), subscriptionId: z.string().optional(),
  type: z.enum(["CHARGE", "CREDIT", "REFUND"]), amount: z.number().positive(),
  currency: z.string().trim().length(3).default("EGP"), description: z.string().trim().min(2).max(300),
});

export async function recordBillingAdjustment(input: z.input<typeof adjustmentSchema>) {
  const user = await requireRole(UserRole.ADMIN);
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid adjustment.");
  const value = parsed.data;
  const { data, error } = await getSupabaseServerClient().rpc("record_ledger_adjustment", {
    p_amount: value.amount, p_client_id: value.clientId, p_created_by_id: user.id,
    p_currency: value.currency, p_description: value.description,
    p_subscription_id: value.subscriptionId ?? "", p_type: value.type,
  });
  if (error) throw error;
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
  return { id: data };
}
