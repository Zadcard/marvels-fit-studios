"use server";

import { z } from "zod";

import { landingLeadStore } from "@/lib/leads/landing-lead-store";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit/rate-limiter";
import {
  fullNameSchema,
  normalizePhoneNumber,
  phoneSchema,
} from "@/lib/validators/id-auth";
import { type JoinNowActionState } from "./join-now-types";

const joinNowSchema = z.object({
  name: fullNameSchema,
  phone: phoneSchema,
});

function rateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many requests from this device. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

export async function submitJoinNowLead(
  _previousState: JoinNowActionState,
  formData: FormData
): Promise<JoinNowActionState> {
  try {
    // Public, unauthenticated form: cap submissions per device so it can't
    // be used to spam the leads pipeline with fake entries.
    await enforceRateLimit({
      action: "join-now",
      maxAttempts: 3,
      windowSeconds: 10 * 60,
      blockSeconds: 15 * 60,
    });
  } catch (caught) {
    if (caught instanceof RateLimitError) {
      return { status: "error", message: rateLimitMessage(caught.retryAfterSeconds) };
    }
    throw caught;
  }

  const parsed = joinNowSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const normalizedPhone = normalizePhoneNumber(parsed.data.phone);

  const existing = await landingLeadStore.phoneExists(normalizedPhone);

  if (existing.client) {
    return {
      status: "error",
      message: "This phone number is already linked to an account.",
      fieldErrors: {
        phone: ["This phone number is already linked to an account."],
      },
    };
  }

  if (existing.lead) {
    return {
      status: "error",
      message: "This phone number has already been submitted.",
      fieldErrors: {
        phone: ["This phone number has already been submitted."],
      },
    };
  }

  await landingLeadStore.create({
      fullName: parsed.data.name,
      phone: normalizedPhone,
      consentAccepted: true,
      source: "landing-join-now",
      status: "NEW",
  });

  return {
    status: "success",
    message: "Your request has been received.",
  };
}
