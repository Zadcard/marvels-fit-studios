import { AdminOverviewScreen } from "@/components/dashboard/admin-overview-screen";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { adminOverviewData } from "@/lib/mocks/admin-overview";

export const metadata = {
  title: "Admin Dashboard Preview",
};

export default function AdminDashboardPreviewPage() {
  return (
    <DashboardRoleShell
      role="admin"
      previewPath="/admin"
      account={{
        name: "Omar Selim",
        subtitle: "Studio administration",
        initials: "OS",
      }}
    >
      <AdminOverviewScreen {...adminOverviewData} />
    </DashboardRoleShell>
  );
}
