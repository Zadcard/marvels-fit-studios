import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center justify-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-bold",
  {
    variants: {
      variant: {
        neutral:
          "bg-[color:var(--mv-app-bg)] text-[color:var(--mv-muted)]",
        accent:
          "bg-[color:var(--mv-primary-soft)] text-[color:var(--mv-primary-deep)]",
        success:
          "bg-[color:var(--mv-success-soft)] text-[color:var(--mv-success-ink)]",
        warning:
          "bg-[color:var(--mv-warning-soft)] text-[color:var(--mv-warning-ink)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
