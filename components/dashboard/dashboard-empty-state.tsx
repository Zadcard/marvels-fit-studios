import { EmptyState } from "@/components/ui/empty-state";

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function DashboardEmptyState({
  title,
  description,
  action,
}: DashboardEmptyStateProps) {
  return <EmptyState title={title} description={description} action={action} />;
}
