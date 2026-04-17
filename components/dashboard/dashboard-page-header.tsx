import { PageHeader } from "@/components/ui/page-header";

type DashboardPageHeaderProps = {
  eyebrow?: string;
  actions?: React.ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  actions,
}: DashboardPageHeaderProps) {
  if (!eyebrow && !actions) {
    return null;
  }

  return <PageHeader eyebrow={eyebrow} actions={actions} />;
}
