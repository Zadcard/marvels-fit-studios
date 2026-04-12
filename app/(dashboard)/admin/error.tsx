"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-feedback";

type AdminDashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminDashboardError({
  error,
  reset,
}: AdminDashboardErrorProps) {
  return (
    <DashboardRouteError
      eyebrow="Admin portal"
      title="This admin view did not load correctly."
      description={error.message || "Retry the page. If it keeps failing, sign in again."}
      onRetry={reset}
    />
  );
}
