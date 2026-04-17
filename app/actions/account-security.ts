"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { idPasswordAuthService } from "@/lib/auth/id-password-auth-service";
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

  revalidatePath("/admin/profile");
  revalidatePath("/coach/settings");
  revalidatePath("/client/settings");
}
