"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { getPrisma } from "@/lib/prisma";
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
