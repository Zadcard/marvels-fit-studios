import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "critical";
  className?: string;
};

const toneClasses = {
  neutral: "bg-[color:var(--mv-app-bg)] text-[color:var(--mv-muted)]",
  brand: "bg-[color:var(--mv-primary-soft)] text-[color:var(--mv-primary-deep)]",
  success: "bg-[color:var(--mv-success-soft)] text-[color:var(--mv-success-ink)]",
  warning: "bg-[color:var(--mv-warning-soft)] text-[color:var(--mv-warning-ink)]",
  critical: "bg-[color:var(--mv-critical-soft)] text-[color:var(--mv-critical-ink)]",
} as const;

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        toneClasses[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
