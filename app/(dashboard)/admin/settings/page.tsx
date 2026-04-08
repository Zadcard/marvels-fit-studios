import { UserRole } from "@prisma/client";

import { saveAdminSettings } from "@/app/actions/admin-settings";
import { AdminSettingsWorkspace } from "@/components/dashboard/admin-settings-workspace";
import { requireRole } from "@/lib/auth/session";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";

export const metadata = {
  title: "Studio Settings",
};

export default async function AdminSettingsPage() {
  await requireRole(UserRole.ADMIN);
  const initialSettings = await adminSettingsRepository.get();

  return (
    <AdminSettingsWorkspace
      initialSettings={initialSettings}
      saveSettingsAction={saveAdminSettings}
    />
  );
}
