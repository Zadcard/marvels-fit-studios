import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-0 px-4 py-[7px] text-xs font-bold leading-none",
  {
    variants: {
      variant: {
        neutral:
          "bg-[color:var(--mv-control)] text-[color:var(--mv-text-2)]",
        accent:
          "bg-[color:var(--mv-primary-wash)] text-[color:var(--mv-primary-bright)]",
        success:
          "bg-[color:var(--mv-mint)] text-[color:var(--mv-pastel-text)]",
        warning:
          "bg-[color:var(--mv-peach)] text-[color:var(--mv-pastel-text)]",
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
