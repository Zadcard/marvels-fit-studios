import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-feedback";

export default function ClientDashboardLoading() {
  return (
    <DashboardRouteLoading
      eyebrow="Client portal"
      title="Loading your client workspace"
      description="Loading sessions, coach details, and plan status."
    />
  );
}
