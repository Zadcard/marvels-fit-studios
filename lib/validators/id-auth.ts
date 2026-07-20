import { z } from "zod";

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("20") && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `+20${digits.slice(1)}`;
  }

  if (/^1[0125]\d{8}$/.test(digits)) {
    return `+20${digits}`;
  }

  return hasPlus ? `+${digits}` : digits;
}

export const clientIdSchema = z
  .string()
  .trim()
  .length(7, "Client ID must be exactly 7 digits")
  .regex(/^\d{7}$/, "Client ID must contain only digits");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must include at least one letter")
  .regex(/[0-9]/, "Password must include at least one number");

export const mfsPasswordSchema = z
  .string()
  .regex(/^MFS_\d{7}$/, "Password must be in format MFS_YYMMXXX")
  .optional();

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((value) => normalizePhoneNumber(value))
  .pipe(
    z
      .string()
      .regex(/^\+?\d{8,15}$/, "Please enter a valid phone number")
  );

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name must be less than 100 characters");

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .optional()
  .or(z.literal(""));

export const emailLoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const clientRegistrationSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
});

export const passwordResetRequestSchema = z.object({
  clientId: clientIdSchema,
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type EmailLogin = z.infer<typeof emailLoginSchema>;
export type ClientRegistration = z.infer<typeof clientRegistrationSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
