"use server";

import { UserRole } from "@/lib/supabase/domain";
import { revalidatePath } from "next/cache";

import type {
  AdminPaymentMethod,
  AdminPaymentStatus,
} from "@/lib/mocks/admin-subscriptions";
import { requireRole } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SaveAdminSubscriptionInput = {
  subscriptionId?: string | null;
  clientId: string;
  planId: string;
  subscriptionStatus: "Active" | "Pending renewal" | "Paused" | "Trial";
  paymentStatus: AdminPaymentStatus;
  amount: string;
  renewalDate: string;
};

type SubscriptionMutation = "pause" | "resume" | "cancel" | "renew";

const subscriptionDurations = [1, 3] as const;
const subscriptionSessionChoices = [8, 12, 16, 20] as const;

type CreateAdminSubscriptionInput = {
  clientId: string;
  durationMonths: (typeof subscriptionDurations)[number];
  sessionsPerMonth: (typeof subscriptionSessionChoices)[number];
  price: string;
  paymentMethod: AdminPaymentMethod;
};

function toStoredPaymentMethod(method: AdminPaymentMethod) {
  switch (method) {
    case "InstaPay":
      return "INSTA_PAY";
    case "Visa":
      return "VISA";
    case "Cash":
      return "CASH";
  }
}

function revalidateSubscriptionViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/schedule");
}

function toSubscriptionStatus(
  status: SaveAdminSubscriptionInput["subscriptionStatus"],
): "ACTIVE" | "TRIAL" | "PAUSED" {
  switch (status) {
    case "Trial":
      return "TRIAL";
    case "Paused":
      return "PAUSED";
    default:
      return "ACTIVE";
  }
}

function toClientPaymentStatus(
  status: AdminPaymentStatus,
): "PAID" | "DUE_SOON" | "UNPAID" {
  switch (status) {
    case "Paid":
      return "PAID";
    case "Due soon":
      return "DUE_SOON";
    default:
      return "UNPAID";
  }
}

function parseAmount(value: string) {
  const normalized = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function parseRenewalDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildMutationSuccessMessage(action: SubscriptionMutation) {
  switch (action) {
    case "pause":
      return "Subscription paused.";
    case "resume":
      return "Subscription resumed.";
    case "cancel":
      return "Subscription canceled.";
    case "renew":
      return "Subscription renewed.";
  }
}

export async function createAdminSubscription(input: CreateAdminSubscriptionInput) {
  await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();

  const clientId = input.clientId.trim();
  if (!clientId) throw new Error("Choose a client.");
  if (!subscriptionDurations.includes(input.durationMonths)) {
    throw new Error("Duration must be one month or a quarter.");
  }
  if (!subscriptionSessionChoices.includes(input.sessionsPerMonth)) {
    throw new Error("Sessions per month must be 8, 12, 16, or 20.");
  }
  const price = parseAmount(input.price);
  if (!price) throw new Error("Enter a valid subscription price.");

  const months = input.durationMonths;
  // Sessions are a per-month allowance regardless of billing duration: a
  // quarterly plan with 20 sessions/month grants 20 each month, not 60 for
  // the whole quarter (the monthly reset is handled by
  // reconcile_subscription_session_windows via nextSessionResetAt below).
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

  const { data: existing, error: existingError } = await supabase
    .from("ClientSubscription")
    .select("id")
    .eq("clientId", clientId)
    .eq("planId", plan.id)
    .neq("status", "CANCELED")
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) throw new Error("This client already has that subscription plan.");

  const startsAt = new Date();
  const renewsAt = new Date(startsAt);
  renewsAt.setMonth(renewsAt.getMonth() + months);
  // Quarterly plans reset the session allowance every month; the monthly
  // marker is null for monthly plans since renewsAt already does the job.
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
    note: `New ${months === 1 ? "monthly" : "quarterly"} subscription · ${input.sessionsPerMonth} sessions/mo.`,
    clientId,
    clientSubscriptionId: subscription.id,
    method: toStoredPaymentMethod(input.paymentMethod),
  });
  if (paymentError) throw paymentError;

  const { error: clientError } = await supabase
    .from("Client")
    .update({ isPaid: true, paymentStatus: "PAID", sessionsLeft: sessionsTotal })
    .eq("id", clientId);
  if (clientError) throw clientError;

  revalidateSubscriptionViews();
  revalidatePath("/admin/reports");

  return { id: subscription.id };
}

export async function saveAdminSubscription(input: SaveAdminSubscriptionInput) {
  await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();
  const clientId = input.clientId.trim();
  const planId = input.planId.trim();
  const amount = parseAmount(input.amount);
  const renewsAt = parseRenewalDate(input.renewalDate);

  if (!clientId) {
    throw new Error("Choose a client.");
  }

  if (!planId) {
    throw new Error("Choose a subscription plan.");
  }

  if (!amount) {
    throw new Error("Enter a valid subscription amount.");
  }

  if (!renewsAt) {
    throw new Error("Enter a valid renewal date.");
  }

  const targetStatus = toSubscriptionStatus(input.subscriptionStatus);
  const clientPaymentStatus = toClientPaymentStatus(input.paymentStatus);
  const { data, error } = await supabase.rpc("admin_save_subscription", {
    payload: {
      subscriptionId: input.subscriptionId ?? null,
      clientId,
      planId,
      status: targetStatus,
      paymentStatus: clientPaymentStatus,
      amount,
      renewsAt: renewsAt.toISOString(),
    },
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Subscription save returned an invalid response.");
  }
  const result = {
    id: String(data.id),
    clientId,
    planId,
    renewsAt: renewsAt.toISOString(),
    amount,
    paymentStatus: input.paymentStatus,
    subscriptionStatus: input.subscriptionStatus,
  };

  revalidateSubscriptionViews();

  return result;
}

type RenewSubscriptionDetails = {
  amount: string;
  sessionsPerMonth: (typeof subscriptionSessionChoices)[number];
  durationMonths: (typeof subscriptionDurations)[number];
  newGroupId?: string;
};

export async function mutateAdminSubscriptionLifecycle(
  subscriptionId: string,
  action: SubscriptionMutation,
  paymentMethod?: AdminPaymentMethod,
  renewalDetails?: RenewSubscriptionDetails,
) {
  await requireRole(UserRole.ADMIN);
  const supabase = getSupabaseServerClient();
  const trimmedSubscriptionId = subscriptionId.trim();

  if (!trimmedSubscriptionId) {
    throw new Error("Subscription id is required.");
  }

  if (action === "renew" && !paymentMethod) {
    throw new Error("Choose how the member paid before renewing.");
  }

  let amount: number | null = null;
  if (action === "renew" && renewalDetails) {
    amount = parseAmount(renewalDetails.amount);
    if (!amount) throw new Error("Enter a valid renewal amount.");
    if (!subscriptionSessionChoices.includes(renewalDetails.sessionsPerMonth)) {
      throw new Error("Sessions per month must be 8, 12, 16, or 20.");
    }
    if (!subscriptionDurations.includes(renewalDetails.durationMonths)) {
      throw new Error("Duration must be one month or a quarter.");
    }
  }

  const { data, error } = await supabase.rpc("admin_mutate_subscription", {
    target_action: action,
    target_id: trimmedSubscriptionId,
    target_payment_method:
      action === "renew" && paymentMethod
        ? toStoredPaymentMethod(paymentMethod)
        : "",
    target_amount: amount,
    target_sessions_per_month: renewalDetails?.sessionsPerMonth ?? null,
    target_duration_months: renewalDetails?.durationMonths ?? null,
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Subscription update returned an invalid response.");
  }
  const result =
    action === "pause"
      ? {
          subscriptionStatus: "Paused" as const,
          paymentStatus: "Manual review" as const,
        }
      : action === "cancel"
        ? {
            subscriptionStatus: "Canceled" as const,
            paymentStatus: "Manual review" as const,
          }
        : action === "resume"
          ? {
              subscriptionStatus: "Active" as const,
              paymentStatus: "Due soon" as const,
            }
          : {
              subscriptionStatus: "Active" as const,
              paymentStatus: "Paid" as const,
            };

  revalidateSubscriptionViews();

  return {
    ...result,
    message:
      action === "renew" && paymentMethod
        ? `Subscription renewed and recorded as ${paymentMethod}.`
        : buildMutationSuccessMessage(action),
  };
}
