"use server";

import bcryptjs from "bcryptjs";
import { z } from "zod";

import { readLeadCredentialClientId, serializeLeadCredentialMetadata } from "@/lib/leads/lead-credential-metadata";
import { landingLeadStore } from "@/lib/leads/landing-lead-store";
import { clientIdGenerator } from "@/lib/services/client-id-generator";
import { passwordGenerator } from "@/lib/services/password-generator";
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

async function reserveNextClientId() {
  const pendingLeads = await landingLeadStore.listPendingCredentialMessages();

  let slot = await clientIdGenerator.getNextAvailableSlot();

  for (let attempts = 0; attempts < 120; attempts += 1) {
    const prefix = `${slot.year.toString().slice(-2)}${String(slot.month).padStart(2, "0")}`;
    const highestLeadNumber = pendingLeads.reduce((max, lead) => {
      const reservedClientId = readLeadCredentialClientId(lead.message);

      if (!reservedClientId || !reservedClientId.startsWith(prefix)) {
        return max;
      }

      return Math.max(max, Number.parseInt(reservedClientId.slice(4, 7), 10));
    }, 0);

    const nextClientNumber = Math.max(slot.clientNumber, highestLeadNumber + 1);

    if (nextClientNumber <= 999) {
      return clientIdGenerator.generateId({
        year: slot.year,
        month: slot.month,
        clientNumber: nextClientNumber,
      });
    }

    const nextDate = new Date(slot.year, slot.month, 1);
    slot = await clientIdGenerator.getNextAvailableSlot(
      nextDate.getMonth() + 1,
      nextDate.getFullYear()
    );
  }

  throw new Error("Could not reserve a new client ID.");
}

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
  const reservedClientId = await reserveNextClientId();
  const temporaryPassword = passwordGenerator.generatePassword(reservedClientId);
  const passwordHash = await bcryptjs.hash(temporaryPassword, 12);

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
      passwordHash,
      message: serializeLeadCredentialMetadata(reservedClientId),
      consentAccepted: true,
      source: "landing-join-now",
      status: "NEW",
  });

  return {
    status: "success",
    message:
      "Your request has been received.",
    credentials: {
      clientId: reservedClientId,
      password: temporaryPassword,
      fullName: parsed.data.name,
      phone: normalizedPhone,
    },
  };
}
