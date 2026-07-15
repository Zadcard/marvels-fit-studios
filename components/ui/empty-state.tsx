import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "border-dashed bg-[color:var(--mv-card)] shadow-none",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CardContent className="grid gap-4 p-5">
        <span className="inline-flex size-11 items-center justify-center rounded-[var(--mv-radius-chip)] bg-[color:var(--mv-success-soft)] text-[color:var(--mv-success-ink)]">
          <Icon size={18} />
        </span>
        <div className="space-y-2">
          <strong className="block text-base font-semibold text-[color:var(--mv-ink)]">
            {title}
          </strong>
          <p className="max-w-[52ch] text-sm leading-6 text-pretty text-[color:var(--mv-body)]">
            {description}
          </p>
        </div>
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
