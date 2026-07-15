import Image from "next/image";

import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  title?: string;
  eyebrow?: string;
  contextLabel?: string;
  contextTone?: "neutral" | "accent" | "success" | "warning";
  className?: string;
  imageClassName?: string;
  imageAlt?: string;
  priority?: boolean;
  size?: "default" | "compact";
};

export function BrandLockup({
  title = "Marvel's Fit Studios",
  eyebrow,
  contextLabel,
  contextTone = "accent",
  className,
  imageClassName,
  imageAlt = "Marvel's Fit Studios logo",
  priority = false,
  size = "default",
}: BrandLockupProps) {
  const compact = size === "compact";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          compact ? "size-[38px]" : "size-[42px]"
        )}
      >
        <Image
          src="/img/Logo-1.png"
          alt={imageAlt}
          width={80}
          height={80}
          priority={priority}
          className={cn(
            "h-[38px] w-auto object-contain",
            imageClassName
          )}
        />
      </span>

      <span className="grid min-w-0 gap-1">
        {eyebrow ? (
          <span className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/55">
            {eyebrow}
          </span>
        ) : null}

        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-[var(--font-display)] text-base font-bold leading-none text-white">
            {title}
          </span>
          {contextLabel ? (
            <StatusPill tone={contextTone} className="shrink-0">
              {contextLabel}
            </StatusPill>
          ) : null}
        </span>
      </span>
    </span>
  );
}
