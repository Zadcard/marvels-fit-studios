import { Badge } from "@/components/ui/badge";

type StatusPillProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warning";
};

export function StatusPill({
  children,
  className,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <Badge variant={tone} className={className}>
      {children}
    </Badge>
  );
}
