"use server";

import { revalidatePath } from "next/cache";
import { LeadStatus, UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import { promoteLeadsToClients } from "@/lib/leads/promote-leads-to-clients";
import type { Database } from "@/lib/supabase/database.types";
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
  revalidatePath("/admin/leads");
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
  revalidatePath("/admin/leads");
}

function revalidateLeadWorkflow() {
  revalidatePath("/admin");
  revalidatePath("/admin/join-requests");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
}

export async function createAdminLead(input: {
  fullName: string;
  phone: string;
  email?: string;
  source: string;
  message?: string;
  categoryId: string;
  preferredAvailability?: string;
}) {
  await requireRole(UserRole.ADMIN);

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (!fullName || !phone) throw new Error("Name and phone are required.");

  const categoryId = input.categoryId.trim();
  const supabase = getSupabaseServerClient();
  const { data: category, error: categoryError } = await supabase
    .from("TrainingCategory")
    .select("id,legacyValue,isActive")
    .eq("id", categoryId)
    .maybeSingle();
  if (categoryError) throw categoryError;
  if (!category?.isActive) throw new Error("Choose an active interested category.");

  const { error } = await supabase.from("Lead").insert({
    fullName,
    phone,
    email: input.email?.trim() || null,
    source: input.source.trim() || "Other",
    message: input.message?.trim() || null,
    categoryId,
    interestedCategory: category.legacyValue as Database["public"]["Enums"]["LegacyTrainingCategory"] | null,
    preferredAvailability: input.preferredAvailability?.trim() || null,
    status: LeadStatus.NEW,
  });
  if (error) throw error;
  revalidateLeadWorkflow();
}

export async function closeLeadAsLost(leadId: string, reason?: string) {
  await requireRole(UserRole.ADMIN);

  const { error } = await getSupabaseServerClient().rpc("close_lead_as_lost", {
    target_lead_id: leadId,
    target_reason: reason?.trim() || "",
  });
  if (error) throw error;
  revalidateLeadWorkflow();
}

type SubscribeLeadInput = {
  leadId: string;
  groupId: string;
  durationMonths: 1 | 3;
  sessionsPerMonth: 8 | 12 | 16 | 20;
  price: string;
  paymentMethod: "InstaPay" | "Visa" | "Cash";
};

function toStoredLeadPaymentMethod(method: SubscribeLeadInput["paymentMethod"]) {
  switch (method) {
    case "InstaPay":
      return "INSTA_PAY";
    case "Visa":
      return "VISA";
    case "Cash":
      return "CASH";
  }
}

// Trial attended -> Subscribe: creates/links the Client (via
// promote_lead_to_client), then a ClientSubscription + Payment for the
// chosen plan. The Payment insert fires the existing BillingLedgerEntry
// trigger, which is what backs the immutable receipt.
export async function subscribeLeadFromTrial(input: SubscribeLeadInput) {
  await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();

  const leadId = input.leadId.trim();
  const groupId = input.groupId.trim();
  if (!leadId) throw new Error("Lead is required.");
  if (!groupId) throw new Error("Choose a group.");
  const { data: leadGroup, error: leadGroupError } = await supabase
    .from("Lead")
    .select("categoryId,trialGroupId,trialGroup:Group!Lead_trialGroupId_fkey(id,categoryId,isActive)")
    .eq("id", leadId)
    .maybeSingle();
  if (leadGroupError) throw leadGroupError;
  if (!leadGroup) throw new Error("Lead not found.");
  if (!leadGroup.trialGroup?.isActive || leadGroup.trialGroup.id !== groupId) {
    throw new Error("Use the active trial group assigned to this lead.");
  }
  if (!leadGroup.categoryId || leadGroup.trialGroup.categoryId !== leadGroup.categoryId) {
    throw new Error("The trial group no longer matches the lead interested category.");
  }
  const price = Number(input.price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Enter a valid subscription price.");
  }

  const { data: promotion, error: promotionError } = await supabase.rpc(
    "promote_lead_to_client",
    { target_lead_id: leadId },
  );
  if (promotionError) throw promotionError;
  const result =
    promotion && typeof promotion === "object" && !Array.isArray(promotion)
      ? promotion
      : null;
  if (result?.outcome === "skipped") {
    throw new Error(
      result.reason === "already_converted"
        ? "This lead was already converted."
        : "An existing account with this email is not a client account.",
    );
  }
  const clientId = result?.clientId ? String(result.clientId) : null;
  if (!clientId) throw new Error("Could not determine the new client record.");

  const months = input.durationMonths;
  const sessionsTotal = input.sessionsPerMonth;
  const slug = `${months === 1 ? "monthly" : "quarterly"}-${input.sessionsPerMonth}-per-month`;

  const { data: planLookup, error: planError } = await supabase
    .from("SubscriptionPlan")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (planError) throw planError;
  let plan = planLookup;
  if (!plan) {
    const inserted = await supabase
      .from("SubscriptionPlan")
      .insert({
        name: `${months === 1 ? "Monthly" : "Quarterly"} · ${input.sessionsPerMonth} sessions/mo`,
        slug,
        billingCycle: months === 1 ? "MONTHLY" : "CUSTOM",
        sessionsIncluded: sessionsTotal,
        price,
        currency: "EGP",
        isActive: true,
      })
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    plan = inserted.data;
  }

  const { error: groupError } = await supabase
    .from("Client")
    .update({ groupId })
    .eq("id", clientId);
  if (groupError) throw groupError;

  const startsAt = new Date();
  const renewsAt = new Date(startsAt);
  renewsAt.setMonth(renewsAt.getMonth() + months);
  const nextSessionResetAt =
    months > 1 ? new Date(new Date(startsAt).setMonth(startsAt.getMonth() + 1)) : null;

  const { data: subscription, error: subscriptionError } = await supabase
    .from("ClientSubscription")
    .insert({
      clientId,
      planId: plan.id,
      status: "ACTIVE",
      startsAt: startsAt.toISOString(),
      renewsAt: renewsAt.toISOString(),
      sessionsTotal,
      isAutoRenew: true,
      customPrice: price,
      cycleMonths: months,
      nextSessionResetAt: nextSessionResetAt ? nextSessionResetAt.toISOString() : null,
    })
    .select("id")
    .single();
  if (subscriptionError) throw subscriptionError;

  const { error: paymentError } = await supabase.from("Payment").insert({
    amount: price,
    currency: "EGP",
    note: `Converted from a trial · ${months === 1 ? "monthly" : "quarterly"} · ${input.sessionsPerMonth} sessions/mo.`,
    clientId,
    clientSubscriptionId: subscription.id,
    method: toStoredLeadPaymentMethod(input.paymentMethod),
  });
  if (paymentError) throw paymentError;

  const { error: clientError } = await supabase
    .from("Client")
    .update({ isPaid: true, paymentStatus: "PAID", sessionsLeft: sessionsTotal, status: "ACTIVE" })
    .eq("id", clientId);
  if (clientError) throw clientError;

  revalidateLeadWorkflow();
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/reports");

  return { clientId, subscriptionId: subscription.id };
}

export async function assignLeadTrial(input: { leadId: string; groupId: string }) {
  await requireRole(UserRole.ADMIN);
  if (!input.groupId) throw new Error("Choose a group for the trial.");

  const supabase = getSupabaseServerClient();
  const { data: group, error: groupError } = await supabase
    .from("Group")
    .select("id,categoryId,isActive")
    .eq("id", input.groupId)
    .eq("isActive", true)
    .maybeSingle();
  if (groupError) throw groupError;
  if (!group) throw new Error("That group is no longer available.");

  const { data: lead, error: leadError } = await supabase
    .from("Lead")
    .select("categoryId")
    .eq("id", input.leadId)
    .maybeSingle();
  if (leadError) throw leadError;
  if (!lead?.categoryId) throw new Error("Choose an interested category for this lead first.");
  if (group.categoryId !== lead.categoryId) {
    throw new Error("Choose a group from the lead interested category.");
  }

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
