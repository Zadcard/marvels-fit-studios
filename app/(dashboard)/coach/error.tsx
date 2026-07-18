"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-feedback";

type CoachDashboardErrorProps = {
  reset: () => void;
};

export default function CoachDashboardError({
  reset,
}: CoachDashboardErrorProps) {
  return (
    <DashboardRouteError
      eyebrow="Coach portal"
      title="Live coaching data is unavailable."
      description="No empty roster or session state is being shown. Retry before recording attendance or client notes."
      onRetry={reset}
    />
  );
}
