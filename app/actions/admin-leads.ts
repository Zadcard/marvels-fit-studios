"use server";

import { revalidatePath } from "next/cache";
import { LeadStatus, UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import { promoteLeadsToClients } from "@/lib/leads/promote-leads-to-clients";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function approveLeadAsClient(leadId: string) {
  await requireRole(UserRole.ADMIN);

  const summary = await promoteLeadsToClients({
    leadIds: [leadId],
  });

  if (summary.examined !== 1) {
    throw new Error("Only a group-assigned completed trial can be subscribed.");
  }

  revalidatePath("/admin");
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

  revalidatePath("/admin");
  revalidatePath("/admin/join-requests");
}

function revalidateLeadWorkflow() {
  revalidatePath("/admin");
  revalidatePath("/admin/join-requests");
  revalidatePath("/admin/clients");
}

export async function createAdminLead(input: {
  fullName: string;
  phone: string;
  email?: string;
  source: string;
  message?: string;
}) {
  await requireRole(UserRole.ADMIN);

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (!fullName || !phone) throw new Error("Name and phone are required.");

  const { error } = await getSupabaseServerClient().from("Lead").insert({
    fullName,
    phone,
    email: input.email?.trim() || null,
    source: input.source.trim() || "Admin",
    message: input.message?.trim() || null,
    status: LeadStatus.NEW,
  });
  if (error) throw error;
  revalidateLeadWorkflow();
}

export async function assignLeadTrial(input: { leadId: string; groupId: string }) {
  await requireRole(UserRole.ADMIN);
  if (!input.groupId) throw new Error("Choose a group for the trial.");

  const supabase = getSupabaseServerClient();
  const { data: group, error: groupError } = await supabase
    .from("Group")
    .select("id")
    .eq("id", input.groupId)
    .eq("isActive", true)
    .maybeSingle();
  if (groupError) throw groupError;
  if (!group) throw new Error("That group is no longer available.");

  const { data, error } = await supabase
    .from("Lead")
    .update({ trialGroupId: input.groupId, status: LeadStatus.CONTACTED })
    .eq("id", input.leadId)
    .eq("status", LeadStatus.NEW)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This lead has already moved to another stage.");
  revalidateLeadWorkflow();
}

export async function completeLeadTrial(leadId: string) {
  await requireRole(UserRole.ADMIN);

  const { data, error } = await getSupabaseServerClient()
    .from("Lead")
    .update({ status: LeadStatus.TRIAL_DONE })
    .eq("id", leadId)
    .eq("status", LeadStatus.CONTACTED)
    .not("trialGroupId", "is", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Only a group-assigned booked trial can be marked complete.");
  revalidateLeadWorkflow();
}
