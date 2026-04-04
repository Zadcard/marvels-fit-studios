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
      title="This coach view did not load correctly."
      description="Retry the page. If it keeps failing, sign in again."
      onRetry={reset}
    />
  );
}
