"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-feedback";

type ClientDashboardErrorProps = {
  reset: () => void;
};

export default function ClientDashboardError({
  reset,
}: ClientDashboardErrorProps) {
  return (
    <DashboardRouteError
      eyebrow="Client portal"
      title="This client view did not load correctly."
      description="Retry the page. If it keeps failing, sign in again."
      onRetry={reset}
    />
  );
}
