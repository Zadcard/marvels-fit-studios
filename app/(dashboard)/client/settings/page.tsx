import { redirect } from "next/navigation";
import { UserRole } from "@/lib/supabase/domain";

import { saveClientSettings } from "@/app/actions/client-settings";
import { ClientSettingsWorkspace } from "@/components/dashboard/client-settings-workspace";
import { requireRole } from "@/lib/auth/session";
import { clientDashboardRepository } from "@/lib/repositories/client-dashboard-repository";

export const metadata = {
  title: "Client Settings",
};

export default async function ClientSettingsPage() {
  let user;

  try {
    user = await requireRole(UserRole.CLIENT);
  } catch {
    redirect("/login");
  }

  const initialSettings = await clientDashboardRepository.getSettings(user.id);

  if (!initialSettings) {
    redirect("/login");
  }

  return (
    <ClientSettingsWorkspace
      initialSettings={initialSettings}
      saveSettingsAction={saveClientSettings}
    />
  );
}
