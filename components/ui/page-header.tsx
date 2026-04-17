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
        "flex flex-col gap-4 rounded-[8px] border border-white/6 bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--mv-muted-strong)]">
            {eyebrow}
          </span>
        ) : null}

        {title ? (
          <h1 className="font-[var(--font-display)] text-[1.4rem] font-semibold leading-tight text-white sm:text-[1.7rem]">
            {title}
          </h1>
        ) : null}

        {description ? (
          <p className="max-w-[58ch] text-sm leading-6 text-[color:var(--mv-muted)]">
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
