import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminReportData } from "@/lib/dashboard/admin-report-data";

const mocks = vi.hoisted(() => ({
  recordExpense: vi.fn(async () => ({ id: "expense-2" })),
  recordCashIn: vi.fn(async () => undefined),
  refresh: vi.fn(),
}));
vi.mock("@/app/actions/admin-expenses", () => ({
  voidStudioExpense: vi.fn(async () => undefined),
  recordStudioExpense: mocks.recordExpense,
}));
vi.mock("@/app/actions/admin-payments", () => ({
  recordCashIn: mocks.recordCashIn,
  saveClientPaymentStatus: vi.fn(async () => undefined),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { AdminReportsWorkspace } from "@/components/dashboard/admin-reports-workspace";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const data: AdminReportData = {
  range: { from: "2026-07-01", to: "2026-07-18", startIso: "", endExclusiveIso: "", timezone: "Africa/Cairo" },
  summary: { income: 1000, expenses: 250, net: 750, paymentCount: 1, sessionCount: 1, attended: 3, missed: 1, attendanceRate: 75 },
  daily: [
    { date: "2026-07-01", income: 1000, expenses: 250, attended: 3, missed: 1 },
    { date: "2026-07-02", income: 400, expenses: 0, attended: 0, missed: 0 },
  ],
  paymentMethods: [{ key: "CASH", label: "Cash", amount: 1000, count: 1 }],
  expenseCategories: [{ key: "SUPPLIES", label: "Supplies", amount: 250, count: 1 }],
  coaches: [],
  recentExpenses: [],
  reconciliation: { paymentTotal: 1000, ledgerPaymentTotal: 1000, difference: 0, missingLedgerCount: 0 },
};

describe("admin reports workspace", () => {
  afterEach(() => { document.body.innerHTML = ""; vi.clearAllMocks(); });

  it("offers date/export controls, cash in/out triggers, and cash lines", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () =>
      root.render(
        <AdminReportsWorkspace
          data={data}
          clientOptions={[{ id: "client-1", fullName: "Sara Nabil" }]}
        />,
      ),
    );
    expect(document.querySelector<HTMLAnchorElement>('a[href*="/api/reports/operations"]')?.href).toContain("from=2026-07-01");

    const buttons = () => Array.from(document.querySelectorAll("button"));
    expect(buttons().some((button) => button.textContent === "+ Record cash in")).toBe(true);
    expect(buttons().some((button) => button.textContent === "+ Record cash out")).toBe(true);

    // Green cash-in and red cash-out lines are rendered for the range.
    const chart = document.querySelector('svg[aria-label="Cash in and cash out per day"]');
    expect(chart).not.toBeNull();
    expect(chart?.querySelectorAll("polyline")).toHaveLength(2);

    // Removed sections stay removed.
    expect(document.body.textContent).not.toContain("Coach load");
    expect(document.body.textContent).not.toContain("Expense ledger");
    expect(document.body.textContent).not.toContain("Payment ledger reconciliation");
    expect(document.body.textContent).not.toContain("Attendance");

    await act(async () => root.unmount());
  });
});
