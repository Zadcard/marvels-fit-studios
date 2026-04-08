import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientSettingsWorkspace } from "@/components/dashboard/client-settings-workspace";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "Client Settings",
};

export default async function ClientSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const initialSettings = await clientDashboardRepository.getSettings(session.user.id);

  if (!initialSettings) {
    redirect("/login");
  }

  return <ClientSettingsWorkspace initialSettings={initialSettings} />;
}
