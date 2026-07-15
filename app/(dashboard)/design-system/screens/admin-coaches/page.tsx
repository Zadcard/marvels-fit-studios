import type { Metadata } from "next";

import AdminCoachesPage from "@/app/(dashboard)/admin/coaches/page";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";

export const metadata: Metadata = {
  title: "Coach Command Center Preview",
  robots: { index: false, follow: false },
};

export default function AdminCoachesPreviewPage() {
  return (
    <DashboardRoleShell
      role="admin"
      account={{ name: "Marvel Admin", subtitle: "Studio administration", initials: "MA" }}
    >
      <AdminCoachesPage />
    </DashboardRoleShell>
  );
}
