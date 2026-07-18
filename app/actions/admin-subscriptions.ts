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
  revalidatePath("/client");
  revalidatePath("/client/subscription");
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

export async function mutateAdminSubscriptionLifecycle(
  subscriptionId: string,
  action: SubscriptionMutation,
  paymentMethod?: AdminPaymentMethod,
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

  const { data, error } = await supabase.rpc("admin_mutate_subscription", {
    target_action: action,
    target_id: trimmedSubscriptionId,
    target_payment_method:
      action === "renew" && paymentMethod
        ? toStoredPaymentMethod(paymentMethod)
        : "",
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
