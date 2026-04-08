import {
  CalendarClock,
  Clock3,
  Target,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardStatIconKey =
  | "calendar-clock"
  | "clock-3"
  | "target"
  | "trending-up"
  | "users-round";

type DashboardStatCardProps = {
  label: string;
  value: string;
  change: string;
  detail: string;
  note: string;
  icon: LucideIcon | DashboardStatIconKey;
  tone: "accent" | "success" | "warning" | "neutral";
};

const dashboardStatIcons: Record<DashboardStatIconKey, LucideIcon> = {
  "calendar-clock": CalendarClock,
  "clock-3": Clock3,
  target: Target,
  "trending-up": TrendingUp,
  "users-round": UsersRound,
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
  const ResolvedIcon =
    typeof Icon === "string" ? dashboardStatIcons[Icon] : Icon;

  return (
    <article className={cn("dashboard-stat-card", `dashboard-stat-card--${tone}`)}>
      <div className="dashboard-stat-card__header">
        <span className="dashboard-stat-card__label">{label}</span>
        <span className="dashboard-stat-card__icon">
          <ResolvedIcon size={18} />
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
