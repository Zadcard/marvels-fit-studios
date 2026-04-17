import { z } from "zod";

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
  .min(8, "Phone number must be at least 8 characters");

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

export const clientIdLoginSchema = z.object({
  clientId: clientIdSchema.describe("7-digit client ID"),
  password: z.string().min(1, "Password is required"),
});

export const emailLoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const clientRegistrationSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
  email: emailSchema,
});

export const passwordResetRequestSchema = z.object({
  clientId: clientIdSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

export type ClientIdLogin = z.infer<typeof clientIdLoginSchema>;
export type EmailLogin = z.infer<typeof emailLoginSchema>;
export type ClientRegistration = z.infer<typeof clientRegistrationSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
