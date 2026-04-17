import { cn } from "@/lib/utils";

type AvatarProps = {
  name?: string | null;
  className?: string;
};

function getInitials(name?: string | null) {
  if (!name) {
    return "?";
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "?";
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,var(--mv-primary),#ff5f64)] text-xs font-semibold uppercase text-white",
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
