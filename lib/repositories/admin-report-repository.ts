import "server-only";

import type { AdminReportData, AdminReportBreakdown } from "@/lib/dashboard/admin-report-data";
import { datesInRange } from "@/lib/reports/report-range";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ReportRange = AdminReportData["range"];

const methodLabels: Record<string, string> = {
  CASH: "Cash", CARD: "Card", BANK_TRANSFER: "Bank transfer",
  INSTAPAY: "InstaPay", CREDIT_CARD: "Card", OTHER: "Other",
};
const categoryLabels: Record<string, string> = {
  SUPPLIES: "Supplies", MAINTENANCE: "Maintenance", COACH_PAYMENT: "Coach payment",
  RENT_UTILITIES: "Rent & utilities", MARKETING: "Marketing", OTHER: "Other",
};

function sumBy<T>(items: T[], value: (item: T) => number) {
  return items.reduce((total, item) => total + value(item), 0);
}

function dateKey(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));
}

function breakdown<T>(items: T[], keyFor: (item: T) => string, amountFor: (item: T) => number, labels: Record<string, string>): AdminReportBreakdown[] {
  const values = new Map<string, { amount: number; count: number }>();
  for (const item of items) {
    const key = keyFor(item);
    const current = values.get(key) ?? { amount: 0, count: 0 };
    current.amount += amountFor(item);
    current.count += 1;
    values.set(key, current);
  }
  return [...values.entries()].map(([key, value]) => ({ key, label: labels[key] ?? key, ...value })).sort((a, b) => b.amount - a.amount);
}

export class AdminReportRepository {
  async getReport(range: ReportRange): Promise<AdminReportData> {
    const supabase = getSupabaseServerClient();
    const [paymentsResult, expensesResult, sessionsResult, ledgerResult] = await Promise.all([
      supabase.from("Payment").select("id,amount,date,method").gte("date", range.startIso).lt("date", range.endExclusiveIso).order("date"),
      supabase.from("StudioExpense").select("id,expenseNumber,amount,category,paymentMethod,description,reference,status,occurredAt,voidReason,createdBy:User!StudioExpense_createdById_fkey(name,email)").gte("occurredAt", range.startIso).lt("occurredAt", range.endExclusiveIso).order("occurredAt", { ascending: false }),
      supabase.from("TrainingSession").select("id,startsAt,endsAt,status,capacity,coach:Coach(id,fullName),bookings:SessionBooking(status)").gte("startsAt", range.startIso).lt("startsAt", range.endExclusiveIso).neq("status", "CANCELED").order("startsAt"),
      supabase.from("BillingLedgerEntry").select("amount,paymentId,occurredAt").eq("type", "PAYMENT").eq("status", "POSTED").gte("occurredAt", range.startIso).lt("occurredAt", range.endExclusiveIso),
    ]);
    if (paymentsResult.error) throw paymentsResult.error;
    if (expensesResult.error) throw expensesResult.error;
    if (sessionsResult.error) throw sessionsResult.error;
    if (ledgerResult.error) throw ledgerResult.error;

    const payments = paymentsResult.data;
    const expenses = expensesResult.data;
    const postedExpenses = expenses.filter((expense) => expense.status === "POSTED");
    const sessions = sessionsResult.data;
    const income = sumBy(payments, (payment) => payment.amount);
    const expenseTotal = sumBy(postedExpenses, (expense) => expense.amount);
    const attended = sumBy(sessions, (session) => session.bookings.filter((booking) => booking.status === "ATTENDED").length);
    const missed = sumBy(sessions, (session) => session.bookings.filter((booking) => ["MISSED", "NO_SHOW"].includes(booking.status)).length);

    const dailyMap = new Map(datesInRange(range.from, range.to).map((date) => [date, { date, income: 0, expenses: 0, attended: 0, missed: 0 }]));
    for (const payment of payments) dailyMap.get(dateKey(payment.date, range.timezone))!.income += payment.amount;
    for (const expense of postedExpenses) dailyMap.get(dateKey(expense.occurredAt, range.timezone))!.expenses += expense.amount;
    for (const session of sessions) {
      const point = dailyMap.get(dateKey(session.startsAt, range.timezone));
      if (!point) continue;
      point.attended += session.bookings.filter((booking) => booking.status === "ATTENDED").length;
      point.missed += session.bookings.filter((booking) => ["MISSED", "NO_SHOW"].includes(booking.status)).length;
    }

    const coachMap = new Map<string, { id: string; fullName: string; sessionCount: number; minutes: number; attendedSeats: number; occupancyTotal: number }>();
    for (const session of sessions) {
      const activeSeats = session.bookings.filter((booking) => ["BOOKED", "ATTENDED"].includes(booking.status)).length;
      const current = coachMap.get(session.coach.id) ?? { id: session.coach.id, fullName: session.coach.fullName, sessionCount: 0, minutes: 0, attendedSeats: 0, occupancyTotal: 0 };
      current.sessionCount += 1;
      current.minutes += Math.max(0, (new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 60_000);
      current.attendedSeats += session.bookings.filter((booking) => booking.status === "ATTENDED").length;
      current.occupancyTotal += session.capacity ? Math.min(100, activeSeats / session.capacity * 100) : 0;
      coachMap.set(session.coach.id, current);
    }

    const ledgerPaymentIds = new Set(ledgerResult.data.flatMap((entry) => entry.paymentId ? [entry.paymentId] : []));
    const ledgerPaymentTotal = sumBy(ledgerResult.data, (entry) => entry.amount);
    return {
      range,
      summary: {
        income, expenses: expenseTotal, net: income - expenseTotal,
        paymentCount: payments.length, sessionCount: sessions.length,
        attended, missed, attendanceRate: attended + missed ? Math.round(attended / (attended + missed) * 100) : 0,
      },
      daily: [...dailyMap.values()],
      paymentMethods: breakdown(payments, (payment) => payment.method ?? "OTHER", (payment) => payment.amount, methodLabels),
      expenseCategories: breakdown(postedExpenses, (expense) => expense.category, (expense) => expense.amount, categoryLabels),
      coaches: [...coachMap.values()].map((coach) => ({
        id: coach.id, fullName: coach.fullName, sessionCount: coach.sessionCount,
        scheduledHours: Math.round(coach.minutes / 6) / 10,
        attendedSeats: coach.attendedSeats,
        occupancyPercent: Math.round(coach.occupancyTotal / coach.sessionCount),
      })).sort((a, b) => b.sessionCount - a.sessionCount || a.fullName.localeCompare(b.fullName)),
      recentExpenses: expenses.map((expense) => ({
        id: expense.id, expenseNumber: expense.expenseNumber, amount: expense.amount,
        categoryLabel: categoryLabels[expense.category] ?? expense.category,
        methodLabel: methodLabels[expense.paymentMethod] ?? expense.paymentMethod,
        description: expense.description, reference: expense.reference ?? "",
        occurredAtLabel: new Intl.DateTimeFormat("en-US", { timeZone: range.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(expense.occurredAt)),
        status: expense.status, createdByLabel: expense.createdBy.name ?? expense.createdBy.email ?? "Admin",
        voidReason: expense.voidReason ?? "",
      })),
      reconciliation: {
        paymentTotal: income, ledgerPaymentTotal,
        difference: income - ledgerPaymentTotal,
        missingLedgerCount: payments.filter((payment) => !ledgerPaymentIds.has(payment.id)).length,
      },
    };
  }
}

export const adminReportRepository = new AdminReportRepository();
