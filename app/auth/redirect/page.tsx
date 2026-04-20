import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDashboardHomeForUserRole } from "@/lib/auth/authorization-policy";
import { getPrisma } from "@/lib/prisma";

export const metadata = {
  title: "Redirecting",
};

export default async function AuthRedirectPage() {
  const session = await auth();
  const userRole = session?.user?.role;

  if (!userRole) {
    redirect("/login");
  }

  if (session.user.id) {
    const user = await getPrisma().user.findUnique({
      where: { id: session.user.id },
      select: {
        mustChangePassword: true,
      },
    });

    if (user?.mustChangePassword) {
      redirect("/change-password");
    }
  }

  redirect(getDashboardHomeForUserRole(userRole));
}
