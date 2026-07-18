import { describe, expect, it } from "vitest";
import { buildOperationsReportCsv } from "./operations-report-csv";
import type { AdminReportData } from "@/lib/dashboard/admin-report-data";

const report: AdminReportData = {
  range: { from: "2026-07-01", to: "2026-07-01", startIso: "", endExclusiveIso: "", timezone: "Africa/Cairo" },
  summary: { income: 1000, expenses: 250, net: 750, paymentCount: 1, sessionCount: 1, attended: 3, missed: 1, attendanceRate: 75 },
  daily: [{ date: "2026-07-01", income: 1000, expenses: 250, attended: 3, missed: 1 }],
  paymentMethods: [], expenseCategories: [], coaches: [],
  recentExpenses: [{ id: "1", expenseNumber: "MFS-OUT-1", amount: 250, categoryLabel: "Supplies", methodLabel: "Cash", description: "Bands, mats", reference: "", occurredAtLabel: "Jul 1", status: "POSTED", createdByLabel: "Admin", voidReason: "" }],
  reconciliation: { paymentTotal: 1000, ledgerPaymentTotal: 1000, difference: 0, missingLedgerCount: 0 },
};

describe("operations report CSV", () => {
  it("exports summaries, daily data, expenses, and reconciliation with CSV escaping", () => {
    const csv = buildOperationsReportCsv(report);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Income EGP,1000");
    expect(csv).toContain('"Bands, mats"');
    expect(csv).toContain("Payments missing ledger entry,0");
  });
});
