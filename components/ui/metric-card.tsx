import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  change?: string;
  icon?: LucideIcon;
  tone?: "brand" | "success" | "warning" | "neutral";
  className?: string;
};

export function MetricCard({
  label,
  value,
  detail,
  change,
  icon,
  tone = "success",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-[color:var(--mv-body)]">
              {label}
            </span>
            <strong className="mt-2 block font-[var(--font-display)] text-4xl font-bold leading-none tabular-nums text-[color:var(--mv-ink)]">
              {value}
            </strong>
          </div>
          {icon ? <IconChip icon={icon} tone={tone} /> : null}
        </div>

        {change || detail ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {change ? (
              <span className="font-bold text-[color:var(--mv-primary-deep)]">
                {change}
              </span>
            ) : null}
            {detail ? (
              <span className="text-pretty text-[color:var(--mv-muted)]">
                {detail}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
