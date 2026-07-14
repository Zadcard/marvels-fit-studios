import { redirect } from "next/navigation";

import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";

export const metadata = {
  title: "Redirecting",
};

export default async function AuthRedirectPage() {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  redirect(getDashboardHomeForUserRole(user.role));
}
