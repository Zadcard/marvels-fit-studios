import { AdminSettingsWorkspace } from "@/components/dashboard/admin-settings-workspace";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  return <AdminSettingsWorkspace settings={await adminSettingsRepository.get()} />;
}
