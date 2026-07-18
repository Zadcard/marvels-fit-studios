import type { NextRequest } from "next/server";

import { getRouteUserOrNull } from "@/lib/auth/route-user";
import { buildOperationsReportCsv } from "@/lib/reports/operations-report-csv";
import { resolveReportRange } from "@/lib/reports/report-range";
import { adminReportRepository } from "@/lib/repositories/admin-report-repository";
import { adminSettingsRepository } from "@/lib/repositories/admin-settings-repository";
import { UserRole } from "@/lib/supabase/domain";

export async function GET(request: NextRequest) {
  const user = await getRouteUserOrNull();
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (user.role !== UserRole.ADMIN) return Response.json({ error: "Forbidden." }, { status: 403 });

  const settings = await adminSettingsRepository.get();
  const range = resolveReportRange({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
  }, settings.timezone);
  const report = await adminReportRepository.getReport(range);
  return new Response(buildOperationsReportCsv(report), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mfs-operations-${range.from}-to-${range.to}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
