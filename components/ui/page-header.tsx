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
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <span className="block text-xs font-extrabold uppercase text-[color:var(--mv-primary-deep)]">
            {eyebrow}
          </span>
        ) : null}

        {title ? (
          <h1 className="font-[var(--font-display)] text-3xl font-bold leading-tight text-balance text-[color:var(--mv-ink)] sm:text-[2.5rem]">
            {title}
          </h1>
        ) : null}

        {description ? (
          <p className="max-w-[62ch] text-base leading-7 text-pretty text-[color:var(--mv-body)]">
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
