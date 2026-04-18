import { AlertTriangle, CircleAlert, Info, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toneMap = {
  neutral: {
    icon: Info,
    container: "border-white/10 bg-white/[0.03] text-white",
    iconWrap: "bg-white/8 text-white/80",
  },
  accent: {
    icon: CircleAlert,
    container: "border-[rgba(230,36,41,0.26)] bg-[rgba(230,36,41,0.08)] text-white",
    iconWrap: "bg-[rgba(230,36,41,0.16)] text-[#ffb5b8]",
  },
  warning: {
    icon: TriangleAlert,
    container: "border-[rgba(245,158,11,0.26)] bg-[rgba(245,158,11,0.08)] text-white",
    iconWrap: "bg-[rgba(245,158,11,0.14)] text-[#f6ca7b]",
  },
  success: {
    icon: AlertTriangle,
    container: "border-[rgba(37,211,102,0.26)] bg-[rgba(37,211,102,0.08)] text-white",
    iconWrap: "bg-[rgba(37,211,102,0.14)] text-[#8ce7ad]",
  },
} as const;

type WarningBannerProps = {
  title: string;
  description?: string;
  tone?: keyof typeof toneMap;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function WarningBanner({
  title,
  description,
  tone = "warning",
  actionLabel,
  onAction,
  className,
}: WarningBannerProps) {
  const Icon = toneMap[tone].icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[8px] border px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
        toneMap[tone].container,
        className
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[8px]",
            toneMap[tone].iconWrap
          )}
        >
          <Icon size={18} />
        </span>

        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          {description ? (
            <p className="text-sm leading-6 text-[color:var(--mv-muted-strong)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actionLabel && onAction ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start whitespace-nowrap"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
