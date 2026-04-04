"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";

type DashboardRouteLoadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

type DashboardRouteErrorProps = DashboardRouteLoadingProps & {
  onRetry: () => void;
};

export function DashboardRouteLoading({
  eyebrow,
  title,
  description,
}: DashboardRouteLoadingProps) {
  return (
    <div className="dashboard-route-state">
      <div className="dashboard-route-state__icon">
        <LoaderCircle size={22} className="animate-spin-slow" />
      </div>
      <span className="mv-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>

      <div className="dashboard-route-state__skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function DashboardRouteError({
  eyebrow,
  title,
  description,
  onRetry,
}: DashboardRouteErrorProps) {
  return (
    <div className="dashboard-route-state dashboard-route-state--error" role="alert">
      <div className="dashboard-route-state__icon">
        <AlertTriangle size={22} />
      </div>
      <span className="mv-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>

      <button type="button" className="mv-btn mv-btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
