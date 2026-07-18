"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-feedback";

type AdminDashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminDashboardError({
  reset,
}: AdminDashboardErrorProps) {
  return (
    <DashboardRouteError
      eyebrow="Admin portal"
      title="Live studio data is unavailable."
      description="No empty totals are being shown. Retry before making scheduling, attendance, or finance decisions."
      onRetry={reset}
    />
  );
}
