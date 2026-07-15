import type { Metadata } from "next";

import AdminOverviewPage from "@/app/(dashboard)/admin/page";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";

export const metadata: Metadata = {
  title: "Admin Overview Preview",
  robots: { index: false, follow: false },
};

export default function AdminOverviewPreviewPage() {
  return (
    <DashboardRoleShell
      role="admin"
      account={{
        name: "Marvel Admin",
        subtitle: "Studio administration",
        initials: "MA",
      }}
    >
      <AdminOverviewPage />
    </DashboardRoleShell>
  );
}
