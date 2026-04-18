"use server";

import { idPasswordAuthService } from "@/lib/auth/id-password-auth-service";
import {
  passwordResetRequestSchema,
  passwordResetSchema,
} from "@/lib/validators/id-auth";

type PasswordResetActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialPasswordResetState: PasswordResetActionState = {
  status: "idle",
  message: "",
};

export async function requestPasswordReset(
  _previousState: PasswordResetActionState,
  formData: FormData
): Promise<PasswordResetActionState> {
  const parsed = passwordResetRequestSchema.safeParse({
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check your Client ID and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await idPasswordAuthService.requestPasswordReset(parsed.data.clientId);

  return {
    status: "success",
    message: "If account exists, reset instructions sent.",
  };
}

export async function resetPasswordWithToken(
  _previousState: PasswordResetActionState,
  formData: FormData
): Promise<PasswordResetActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await idPasswordAuthService.resetPassword(
      parsed.data.token,
      parsed.data.newPassword
    );

    return {
      status: "success",
      message: "Password updated. You can sign in with your new password.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not reset password. Try again.",
    };
  }
}
