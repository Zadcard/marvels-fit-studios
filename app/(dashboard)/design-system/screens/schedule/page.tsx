import { AdminScheduleWorkspace } from "@/components/dashboard/admin-schedule-workspace";
import { DashboardRoleShell } from "@/components/dashboard/dashboard-role-shell";
import { adminSchedulePreviewData } from "@/lib/mocks/admin-schedule";

export const metadata = {
  title: "Scheduling Dashboard Preview",
};

export default function SchedulingDashboardPreviewPage() {
  return (
    <DashboardRoleShell
      role="admin"
      previewPath="/admin/schedule"
      account={{
        name: "Omar Selim",
        subtitle: "Studio administration",
        initials: "OS",
      }}
    >
      <AdminScheduleWorkspace {...adminSchedulePreviewData} />
    </DashboardRoleShell>
  );
}
