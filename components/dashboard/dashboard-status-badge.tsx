import { StatusPill } from "@/components/ui/status-pill";

type DashboardStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "accent" | "success" | "warning";
};

export function DashboardStatusBadge({
  label,
  tone = "neutral",
}: DashboardStatusBadgeProps) {
  return <StatusPill tone={tone}>{label}</StatusPill>;
}
