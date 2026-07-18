import type { AdminReportData } from "@/lib/dashboard/admin-report-data";

function cell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildOperationsReportCsv(data: AdminReportData) {
  const rows: Array<Array<string | number>> = [
    ["Marvel Fit Studios operations report"],
    ["From", data.range.from, "To", data.range.to, "Timezone", data.range.timezone],
    [],
    ["Summary", "Value"],
    ["Income EGP", data.summary.income],
    ["Expenses EGP", data.summary.expenses],
    ["Net EGP", data.summary.net],
    ["Payments", data.summary.paymentCount],
    ["Sessions", data.summary.sessionCount],
    ["Attended", data.summary.attended],
    ["Missed", data.summary.missed],
    ["Attendance rate %", data.summary.attendanceRate],
    [],
    ["Date", "Income EGP", "Expenses EGP", "Attended", "Missed"],
    ...data.daily.map((point) => [point.date, point.income, point.expenses, point.attended, point.missed]),
    [],
    ["Coach", "Sessions", "Scheduled hours", "Attended seats", "Average occupancy %"],
    ...data.coaches.map((coach) => [coach.fullName, coach.sessionCount, coach.scheduledHours, coach.attendedSeats, coach.occupancyPercent]),
    [],
    ["Expense number", "Date", "Status", "Category", "Method", "Description", "Amount EGP", "Reference", "Created by", "Void reason"],
    ...data.recentExpenses.map((expense) => [expense.expenseNumber, expense.occurredAtLabel, expense.status, expense.categoryLabel, expense.methodLabel, expense.description, expense.amount, expense.reference, expense.createdByLabel, expense.voidReason]),
    [],
    ["Reconciliation", "Value"],
    ["Payment table EGP", data.reconciliation.paymentTotal],
    ["Billing ledger EGP", data.reconciliation.ledgerPaymentTotal],
    ["Difference EGP", data.reconciliation.difference],
    ["Payments missing ledger entry", data.reconciliation.missingLedgerCount],
  ];
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}
