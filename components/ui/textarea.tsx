import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-[8px] border border-[color:var(--mv-line)] bg-[var(--mv-surface)] px-3 py-3 text-sm text-white placeholder:text-[color:var(--mv-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mv-bg)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
