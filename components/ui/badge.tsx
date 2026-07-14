import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[8px] border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        neutral:
          "border-white/10 bg-white/6 text-[color:var(--mv-muted-strong)]",
        accent:
          "border-[rgba(230,36,41,0.28)] bg-[rgba(230,36,41,0.12)] text-[#ffb5b8]",
        success:
          "border-[rgba(52,211,153,0.30)] bg-[rgba(16,185,129,0.14)] text-[#6ee7b7]",
        warning:
          "border-[rgba(251,191,36,0.32)] bg-[rgba(245,158,11,0.14)] text-[#fcd34d]",
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
