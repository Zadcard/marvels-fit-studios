import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminReportData } from "@/lib/dashboard/admin-report-data";

const mocks = vi.hoisted(() => ({
  voidExpense: vi.fn(async () => undefined),
  recordExpense: vi.fn(async () => ({ id: "expense-2" })),
  refresh: vi.fn(),
}));
vi.mock("@/app/actions/admin-expenses", () => ({
  voidStudioExpense: mocks.voidExpense,
  recordStudioExpense: mocks.recordExpense,
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
  daily: [{ date: "2026-07-01", income: 1000, expenses: 250, attended: 3, missed: 1 }],
  paymentMethods: [{ key: "CASH", label: "Cash", amount: 1000, count: 1 }],
  expenseCategories: [{ key: "SUPPLIES", label: "Supplies", amount: 250, count: 1 }],
  coaches: [{ id: "coach-1", fullName: "Coach One", sessionCount: 1, scheduledHours: 1, attendedSeats: 3, occupancyPercent: 50 }],
  recentExpenses: [{ id: "6c00f25f-fb97-49c7-8b7a-3d47e0d3ef22", expenseNumber: "MFS-OUT-1", amount: 250, categoryLabel: "Supplies", methodLabel: "Cash", description: "Studio bands", reference: "R-1", occurredAtLabel: "Jul 1", status: "POSTED", createdByLabel: "Admin", voidReason: "" }],
  reconciliation: { paymentTotal: 1000, ledgerPaymentTotal: 1000, difference: 0, missingLedgerCount: 0 },
};

describe("admin reports workspace", () => {
  afterEach(() => { document.body.innerHTML = ""; vi.clearAllMocks(); });

  it("offers date/export controls and persists a void audit reason", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<AdminReportsWorkspace data={data} />));
    expect(document.querySelector<HTMLAnchorElement>('a[href*="/api/reports/operations"]')?.href).toContain("from=2026-07-01");
    const voidButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Void");
    await act(async () => voidButton?.click());
    const reason = document.querySelector<HTMLInputElement>('input[placeholder="Audit reason"]');
    if (reason) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(reason, "Duplicate receipt");
      reason.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const confirm = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Confirm void");
    await act(async () => confirm?.click());
    expect(mocks.voidExpense).toHaveBeenCalledWith("6c00f25f-fb97-49c7-8b7a-3d47e0d3ef22", "Duplicate receipt");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    await act(async () => root.unmount());
  });
});
