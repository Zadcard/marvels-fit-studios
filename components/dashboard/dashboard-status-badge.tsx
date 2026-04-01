import { cn } from "@/lib/utils";

type DashboardStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "accent" | "success" | "warning";
};

export function DashboardStatusBadge({
  label,
  tone = "neutral",
}: DashboardStatusBadgeProps) {
  return (
    <span
      className={cn(
        "dashboard-badge",
        tone === "accent" && "dashboard-badge--accent",
        tone === "success" && "dashboard-badge--success",
        tone === "warning" && "dashboard-badge--warning"
      )}
    >
      {label}
    </span>
  );
}
