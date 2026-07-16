"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import styles from "./dashboard-route-feedback.module.css";

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
    <div className={styles.state}>
      <div className={styles.icon}>
        <LoaderCircle size={22} className="animate-spin-slow" />
      </div>
      <span className={styles.kicker}>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>

      <div className={styles.skeleton} aria-hidden="true">
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
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <div className={styles.icon}>
        <AlertTriangle size={22} />
      </div>
      <span className={styles.kicker}>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>

      <button type="button" className="mv-btn mv-btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
