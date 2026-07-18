import { AdminReportsWorkspace } from "@/components/dashboard/admin-reports-workspace";
import { adminReportRepository } from "@/lib/repositories/admin-report-repository";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";
import { resolveReportRange } from "@/lib/reports/report-range";

export const metadata = { title: "Reports" };

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export default async function AdminReportsPage(props: PageProps<"/admin/reports">) {
  const query = await props.searchParams;
  const settings = await adminSettingsRepository.get();
  const range = resolveReportRange({ from: value(query.from), to: value(query.to) }, settings.timezone);
  return <AdminReportsWorkspace data={await adminReportRepository.getReport(range)} />;
}
