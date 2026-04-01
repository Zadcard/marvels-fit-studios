import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardStatCardProps = {
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon;
  tone: "accent" | "success" | "warning" | "neutral";
};

export function DashboardStatCard({
  label,
  value,
  change,
  detail,
  note,
  icon: Icon,
  tone,
}: DashboardStatCardProps) {
  return (
    <article className={cn("dashboard-stat-card", `dashboard-stat-card--${tone}`)}>
      <div className="dashboard-stat-card__header">
        <span className="dashboard-stat-card__label">{label}</span>
        <span className="dashboard-stat-card__icon">
          <Icon size={18} />
        </span>
      </div>

      <div className="dashboard-stat-card__value">{value}</div>
      <p className="dashboard-stat-card__detail">{detail}</p>

      <div className="dashboard-stat-card__footer">
        <span className="dashboard-stat-card__change">{change}</span>
        <span className="dashboard-stat-card__note">{note}</span>
      </div>
    </article>
  );
}
