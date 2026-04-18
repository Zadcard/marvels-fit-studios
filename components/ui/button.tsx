import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[8px] border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mv-bg)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--mv-primary)] text-white shadow-[0_14px_28px_rgba(230,36,41,0.18)] hover:bg-[var(--mv-primary-deep)]",
        secondary:
          "border-[color:var(--mv-line-strong)] bg-white/5 text-white hover:bg-white/10",
        ghost:
          "border-transparent bg-transparent text-[color:var(--mv-muted-strong)] hover:bg-white/6 hover:text-white",
        outline:
          "border-[color:var(--mv-line)] bg-transparent text-white hover:border-[color:var(--mv-line-strong)] hover:bg-white/6",
        destructive:
          "border-transparent bg-[var(--mv-danger)] text-white shadow-[0_14px_28px_rgba(239,68,68,0.18)] hover:bg-[#dc2626]",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
