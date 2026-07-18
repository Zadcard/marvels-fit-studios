"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole, requireUser } from "@/lib/auth/session";
import { idPasswordAuthService } from "@/lib/auth/id-password-auth-service";
import { passwordResetService } from "@/lib/auth/password-reset-service";
import { UserRole } from "@/lib/supabase/domain";
import { changePasswordSchema } from "@/lib/validators/id-auth";

type ChangeOwnPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changeOwnPassword(input: ChangeOwnPasswordInput) {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Please check the password fields."
    );
  }

  await idPasswordAuthService.changePassword(
    user.id,
    parsed.data.currentPassword,
    parsed.data.newPassword
  );

  revalidatePath("/change-password");
}

const issuePasswordResetSchema = z.object({
  profileId: z.string().trim().min(1, "Account identifier is required."),
  profileType: z.enum(["client", "coach"]),
});

export async function issueAccountPasswordResetLink(input: {
  profileId: string;
  profileType: "client" | "coach";
}) {
  const admin = await requireRole(UserRole.ADMIN);
  const parsed = issuePasswordResetSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Please check the account details.",
    );
  }

  return passwordResetService.issue(parsed.data, admin.id);
}
