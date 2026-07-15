import { PageHeader } from "@/components/ui/page-header";

type DashboardPageHeaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  if (!eyebrow && !title && !description && !actions) {
    return null;
  }

  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
    />
  );
}
