import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  if (!eyebrow && !title && !description && !actions) {
    return null;
  }

  return (
    <header
      className={cn(
        "dashboard-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <span className="mv-eyebrow block">
            {eyebrow}
          </span>
        ) : null}

        {title ? (
          <h1 className="text-balance font-[var(--font-display)] text-[1.65rem] font-extrabold leading-tight text-white">
            {title}
          </h1>
        ) : null}

        {description ? (
          <p className="max-w-[58ch] text-pretty text-sm leading-6 text-[color:var(--mv-text-2)]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
