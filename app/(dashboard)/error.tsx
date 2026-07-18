"use client";

import { DashboardRouteError } from "@/components/dashboard/dashboard-route-feedback";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <DashboardRouteError
      eyebrow="Operations workspace"
      title="Live studio data is unavailable."
      description="No empty totals, rosters, or schedules are being shown. Retry before making operational decisions."
      onRetry={reset}
    />
  );
}
