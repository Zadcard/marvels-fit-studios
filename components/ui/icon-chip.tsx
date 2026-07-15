import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type IconChipProps = {
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "neutral";
  className?: string;
};

const toneClasses = {
  brand: "bg-[color:var(--mv-primary-soft)] text-[color:var(--mv-primary-deep)]",
  success: "bg-[color:var(--mv-success-soft)] text-[color:var(--mv-success-ink)]",
  warning: "bg-[color:var(--mv-warning-soft)] text-[color:var(--mv-warning-ink)]",
  neutral: "bg-[color:var(--mv-app-bg)] text-[color:var(--mv-body)]",
} as const;

export function IconChip({
  icon: Icon,
  tone = "success",
  className,
}: IconChipProps) {
  return (
    <span
      className={cn(
        "inline-flex size-[34px] shrink-0 items-center justify-center rounded-[var(--mv-radius-chip)]",
        toneClasses[tone],
        className,
      )}
      aria-hidden="true"
    >
      <Icon size={17} strokeWidth={2.1} />
    </span>
  );
}
