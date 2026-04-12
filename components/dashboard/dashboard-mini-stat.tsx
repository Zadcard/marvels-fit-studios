import { cn } from "@/lib/utils";

type DashboardMiniStatProps = {
  label: string;
  value: React.ReactNode;
  description: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
  className?: string;
};

export function DashboardMiniStat({
  label,
  value,
  description,
  tone = "neutral",
  className,
}: DashboardMiniStatProps) {
  return (
    <article
      className={cn(
        "dashboard-mini-stat",
        tone !== "neutral" && `dashboard-mini-stat--${tone}`,
        className
      )}
    >
      <span className="dashboard-mini-stat__label">{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}
