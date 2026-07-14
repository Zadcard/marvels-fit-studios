"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import { promoteLeadsToClients } from "@/lib/leads/promote-leads-to-clients";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function approveLeadAsClient(leadId: string) {
  await requireRole(UserRole.ADMIN);

  const summary = await promoteLeadsToClients({
    leadIds: [leadId],
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/join-requests");
  revalidatePath("/admin/clients");

  return summary;
}

export async function deleteLead(leadId: string) {
  await requireRole(UserRole.ADMIN);

  const { error } = await getSupabaseServerClient()
    .from("Lead")
    .delete()
    .eq("id", leadId);
  if (error) throw error;

  revalidatePath("/admin/leads");
  revalidatePath("/admin/join-requests");
}
