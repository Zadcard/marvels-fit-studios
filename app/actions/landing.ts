"use server";

import { z } from "zod";

import { landingLeadStore } from "@/lib/leads/landing-lead-store";
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

export async function submitJoinNowLead(
  _previousState: JoinNowActionState,
  formData: FormData
): Promise<JoinNowActionState> {
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
