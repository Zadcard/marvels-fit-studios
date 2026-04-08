import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";

export const metadata = {
  title: "Redirecting",
};

export default async function AuthRedirectPage() {
  const session = await auth();
  const userRole = session?.user?.role;

  if (!userRole) {
    redirect("/login");
  }

  redirect(getDashboardHomeForUserRole(userRole));
}
