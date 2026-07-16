import Image from "next/image";

import brandMark from "@/public/img/Logo-3.png";

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
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[color:var(--rl-red)]",
          compact ? "size-10" : "size-12 sm:size-14"
        )}
      >
        <Image
          src={brandMark}
          alt={imageAlt}
          width={80}
          height={80}
          priority={priority}
          className={cn(
            "object-contain brightness-0 invert",
            compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9",
            imageClassName
          )}
        />
      </span>

      <span className="grid min-w-0 gap-1">
        {eyebrow ? (
          <span className="truncate text-[0.68rem] font-bold uppercase text-[color:var(--rl-muted)]">
            {eyebrow}
          </span>
        ) : null}

        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-[var(--font-display)] text-[0.96rem] font-semibold leading-none text-[color:var(--rl-ink)] sm:text-[1.02rem]">
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
