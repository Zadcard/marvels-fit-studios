import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center justify-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-bold",
  {
    variants: {
      variant: {
        neutral: "bg-[color:var(--rl-soft)] text-[color:var(--rl-muted)]",
        accent: "bg-[color:var(--rl-red-soft)] text-[color:var(--rl-red-deep)]",
        success: "bg-[color:var(--rl-success-soft)] text-[color:var(--rl-success)]",
        warning: "bg-[color:var(--rl-warning-soft)] text-[color:var(--rl-warning)]",
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
