"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { promoteLeadsToClients } from "@/lib/leads/promote-leads-to-clients";
import { UserRole } from "@prisma/client";

export async function approveLeadAsClient(leadId: string) {
  const session = await auth();

  if (session?.user?.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }

  const summary = await promoteLeadsToClients({
    leadIds: [leadId],
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");

  return summary;
}
