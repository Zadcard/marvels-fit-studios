"use server";

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { getPrisma, getPrismaPool } from "@/lib/prisma";

const joinNowSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  phone: z.string().trim().min(8, "Please enter a valid phone number."),
  email: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
  message: z.string().trim().max(1000, "Message is too long.").optional(),
  privacy: z.string().refine((value) => value === "on", {
    message: "You need to agree before submitting.",
  }),
});

type JoinNowFieldName =
  | "name"
  | "phone"
  | "email"
  | "password"
  | "message"
  | "privacy";

export type JoinNowActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<JoinNowFieldName, string[]>>;
};

export const initialJoinNowState: JoinNowActionState = {
  status: "idle",
  message: "",
};

export async function submitJoinNowLead(
  _previousState: JoinNowActionState,
  formData: FormData
): Promise<JoinNowActionState> {
  const parsed = joinNowSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    message: formData.get("message") || undefined,
    privacy: formData.get("privacy"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const prisma = getPrisma();
  const pool = getPrismaPool();
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

  const existingLead = await pool.query<{ id: string }>(
    'SELECT "id" FROM "Lead" WHERE "email" = $1 LIMIT 1',
    [normalizedEmail]
  );

  if (existingLead.rowCount) {
    return {
      status: "error",
      message: "This email has already been submitted.",
      fieldErrors: {
        email: ["This email has already been submitted."],
      },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await pool.query(
    `INSERT INTO "Lead"
      ("id", "fullName", "phone", "email", "passwordHash", "message", "consentAccepted", "source", "status", "createdAt", "updatedAt")
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, 'landing-join-now', 'NEW', NOW(), NOW())`,
    [
      randomUUID(),
      parsed.data.name,
      parsed.data.phone,
      normalizedEmail,
      passwordHash,
      parsed.data.message?.trim() || null,
      true,
    ]
  );

  return {
    status: "success",
    message:
      "Your registration has been received. The studio team will contact you soon.",
  };
}
