"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { promoteLeadsToClients } from "@/lib/leads/promote-leads-to-clients";

export async function approveLeadAsClient(leadId: string) {
  await requireRole(UserRole.ADMIN);

  const summary = await promoteLeadsToClients({
    leadIds: [leadId],
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");

  return summary;
}
