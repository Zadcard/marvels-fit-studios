import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-feedback";

export default function AdminDashboardLoading() {
  return (
    <DashboardRouteLoading
      eyebrow="Admin portal"
      title="Loading the admin overview"
      description="Loading queue, session, billing, and activity signals."
    />
  );
}
