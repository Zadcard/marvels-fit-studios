"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";
import { clientRegistrationService } from "@/lib/services/client-registration-service";
import { type JoinNowActionState } from "./join-now-types";

const joinNowSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  phone: z.string().trim().min(8, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
});

const registerClientSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  phone: z.string().trim().min(8, "Please enter a valid phone number."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),
});

export async function submitJoinNowLead(
  _previousState: JoinNowActionState,
  formData: FormData
): Promise<JoinNowActionState> {
  const parsed = joinNowSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const prisma = getPrisma();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "This email is already linked to an account.",
      fieldErrors: {
        email: ["This email is already linked to an account."],
      },
    };
  }

  const existingLead = await prisma.lead.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingLead) {
    return {
      status: "error",
      message: "This email has already been submitted.",
      fieldErrors: {
        email: ["This email has already been submitted."],
      },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.lead.create({
    data: {
      fullName: parsed.data.name,
      phone: parsed.data.phone,
      email: normalizedEmail,
      passwordHash,
      consentAccepted: true,
      source: "landing-join-now",
      status: "NEW",
    },
  });

  return {
    status: "success",
    message:
      "Your request has been received. The studio team will contact you soon.",
  };
}

export async function registerClientWithAutoCredentials(
  _previousState: JoinNowActionState,
  formData: FormData
): Promise<JoinNowActionState> {
  const parsed = registerClientSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const prisma = getPrisma();

  const phoneAvailable = await clientRegistrationService.isPhoneAvailable(
    parsed.data.phone
  );

  if (!phoneAvailable) {
    return {
      status: "error",
      message: "This phone number is already registered.",
      fieldErrors: {
        phone: ["This phone number is already registered."],
      },
    };
  }

  if (parsed.data.email) {
    const normalizedEmail = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return {
        status: "error",
        message: "This email is already linked to an account.",
        fieldErrors: {
          email: ["This email is already linked to an account."],
        },
      };
    }
  }

  try {
    const result = await clientRegistrationService.registerClient({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
    });

    return {
      status: "success",
      message: `Account created! Your Client ID: ${result.clientId} | Password: ${result.temporaryPassword}`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        "An error occurred while creating your account. Please try again.",
    };
  }
}
