export type AdminReportDailyPoint = {
  date: string;
  income: number;
  expenses: number;
  attended: number;
  missed: number;
};

export type AdminReportBreakdown = {
  key: string;
  label: string;
  amount: number;
  count: number;
};

export type AdminReportCoachRow = {
  id: string;
  fullName: string;
  sessionCount: number;
  scheduledHours: number;
  attendedSeats: number;
  occupancyPercent: number;
};

export type AdminReportExpense = {
  id: string;
  expenseNumber: string;
  amount: number;
  categoryLabel: string;
  methodLabel: string;
  description: string;
  reference: string;
  occurredAtLabel: string;
  status: "POSTED" | "VOID";
  createdByLabel: string;
  voidReason: string;
};

export type AdminReportData = {
  range: { from: string; to: string; startIso: string; endExclusiveIso: string; timezone: string };
  summary: {
    income: number;
    expenses: number;
    net: number;
    paymentCount: number;
    sessionCount: number;
    attended: number;
    missed: number;
    attendanceRate: number;
  };
  daily: AdminReportDailyPoint[];
  paymentMethods: AdminReportBreakdown[];
  expenseCategories: AdminReportBreakdown[];
  coaches: AdminReportCoachRow[];
  recentExpenses: AdminReportExpense[];
  reconciliation: {
    paymentTotal: number;
    ledgerPaymentTotal: number;
    difference: number;
    missingLedgerCount: number;
  };
};
