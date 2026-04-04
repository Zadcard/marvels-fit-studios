import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-feedback";

export default function CoachDashboardLoading() {
  return (
    <DashboardRouteLoading
      eyebrow="Coach portal"
      title="Loading your coach workspace"
      description="Loading roster, schedule, and sessions."
    />
  );
}
