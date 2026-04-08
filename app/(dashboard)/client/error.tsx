"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-feedback";

type ClientDashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClientDashboardError({
  error,
  reset,
}: ClientDashboardErrorProps) {
  return (
    <DashboardRouteError
      eyebrow="Client portal"
      title="This client view did not load correctly."
      description={error.message || "Retry the page. If it keeps failing, sign in again."}
      onRetry={reset}
    />
  );
}
