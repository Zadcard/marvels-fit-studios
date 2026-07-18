"use client";

import { BanknoteArrowDown, BanknoteArrowUp, Download, Scale, UsersRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { voidStudioExpense } from "@/app/actions/admin-expenses";
import { AdminCashOutDialog } from "@/components/dashboard/admin-cash-out-dialog";
import type { AdminReportData, AdminReportBreakdown } from "@/lib/dashboard/admin-report-data";
import styles from "./admin-reports-workspace.module.css";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP", maximumFractionDigits: 0 });

function Breakdown({ title, items, empty }: { title: string; items: AdminReportBreakdown[]; empty: string }) {
  const max = Math.max(1, ...items.map((item) => item.amount));
  return <section className={styles.panel}><header><h2>{title}</h2></header><div className={styles.breakdown}>{items.length ? items.map((item) => <div key={item.key}><span>{item.label}<small>{item.count} entries</small></span><b>{money.format(item.amount)}</b><i><em style={{ width: `${item.amount / max * 100}%` }} /></i></div>) : <p className={styles.empty}>{empty}</p>}</div></section>;
}

export function AdminReportsWorkspace({ data }: { data: AdminReportData }) {
  const router = useRouter();
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const maxDaily = Math.max(1, ...data.daily.flatMap((point) => [point.income, point.expenses]));
  const exportHref = `/api/reports/operations?from=${encodeURIComponent(data.range.from)}&to=${encodeURIComponent(data.range.to)}`;

  function voidExpense() {
    if (!voidingId || !reason.trim()) return;
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        await voidStudioExpense(voidingId, reason);
        setVoidingId(null);
        setReason("");
        setMessage("Expense voided with an audit reason.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The expense could not be voided.");
      }
    });
  }

  return <div className={styles.page}>
    <section className={styles.toolbar}>
      <form method="get" action="/admin/reports"><label>From<input name="from" type="date" defaultValue={data.range.from} /></label><label>To<input name="to" type="date" defaultValue={data.range.to} /></label><button type="submit">Apply range</button></form>
      <a href={exportHref}><Download size={15} /> Export CSV</a>
      <AdminCashOutDialog />
    </section>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {message ? <p className={styles.success} role="status">{message}</p> : null}

    <section className={styles.kpis} aria-label="Report summary">
      <article><span><BanknoteArrowUp size={15} /> Income</span><strong>{money.format(data.summary.income)}</strong><small>{data.summary.paymentCount} payments</small></article>
      <article><span><BanknoteArrowDown size={15} /> Expenses</span><strong>{money.format(data.summary.expenses)}</strong><small>Posted cash out</small></article>
      <article data-tone={data.summary.net >= 0 ? "positive" : "negative"}><span><Scale size={15} /> Net</span><strong>{money.format(data.summary.net)}</strong><small>Income minus expenses</small></article>
      <article><span><UsersRound size={15} /> Attendance</span><strong>{data.summary.attendanceRate}%</strong><small>{data.summary.attended} attended &middot; {data.summary.missed} missed</small></article>
    </section>

    <section className={styles.panel}><header><div><h2>Daily cash movement</h2><p>{data.range.from} through {data.range.to} &middot; {data.range.timezone}</p></div><span>Green income &middot; red expense</span></header><div className={styles.chart}>{data.daily.map((point) => <div key={point.date} title={`${point.date}: ${money.format(point.income)} in, ${money.format(point.expenses)} out`}><span><i style={{ height: `${Math.max(2, point.income / maxDaily * 100)}%` }} /><em style={{ height: `${Math.max(2, point.expenses / maxDaily * 100)}%` }} /></span><small>{point.date.slice(5)}</small></div>)}</div></section>

    <div className={styles.twoColumns}><Breakdown title="Income by payment method" items={data.paymentMethods} empty="No payments in this range." /><Breakdown title="Expenses by category" items={data.expenseCategories} empty="No posted expenses in this range." /></div>

    <section className={styles.panel}><header><div><h2>Coach load &amp; occupancy</h2><p>{data.summary.sessionCount} non-canceled sessions in range</p></div></header><div className={styles.tableWrap}><table><thead><tr><th>Coach</th><th>Sessions</th><th>Scheduled</th><th>Attended seats</th><th>Avg. occupancy</th></tr></thead><tbody>{data.coaches.length ? data.coaches.map((coach) => <tr key={coach.id}><td>{coach.fullName}</td><td>{coach.sessionCount}</td><td>{coach.scheduledHours} hr</td><td>{coach.attendedSeats}</td><td><span className={styles.occupancy}><i><em style={{ width: `${coach.occupancyPercent}%` }} /></i>{coach.occupancyPercent}%</span></td></tr>) : <tr><td colSpan={5} className={styles.empty}>No sessions in this range.</td></tr>}</tbody></table></div></section>

    <div className={styles.twoColumns}>
      <section className={styles.panel}><header><div><h2>Expense ledger</h2><p>Posted entries are corrected by voiding, never deletion.</p></div></header><div className={styles.expenses}>{data.recentExpenses.length ? data.recentExpenses.slice(0, 12).map((expense) => <article key={expense.id} data-void={expense.status === "VOID" || undefined}><span><strong>{expense.description}</strong><small>{expense.expenseNumber} &middot; {expense.categoryLabel} &middot; {expense.methodLabel}</small><small>{expense.occurredAtLabel} &middot; {expense.createdByLabel}{expense.reference ? ` · Ref ${expense.reference}` : ""}</small>{expense.voidReason ? <small>Void reason: {expense.voidReason}</small> : null}</span><b>{money.format(expense.amount)}</b>{expense.status === "POSTED" ? voidingId === expense.id ? <div className={styles.voidForm}><input maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Audit reason" /><button type="button" onClick={voidExpense} disabled={pending || reason.trim().length < 2}>Confirm void</button><button type="button" onClick={() => { setVoidingId(null); setReason(""); }}>Cancel</button></div> : <button type="button" onClick={() => { setVoidingId(expense.id); setReason(""); }}>Void</button> : <em>Void</em>}</article>) : <p className={styles.empty}>No expenses in this range.</p>}</div></section>
      <section className={styles.panel}><header><div><h2>Payment ledger reconciliation</h2><p>Payment rows compared with posted payment-ledger entries.</p></div></header><dl className={styles.reconciliation}><div><dt>Payment table</dt><dd>{money.format(data.reconciliation.paymentTotal)}</dd></div><div><dt>Billing ledger</dt><dd>{money.format(data.reconciliation.ledgerPaymentTotal)}</dd></div><div data-alert={data.reconciliation.difference !== 0 || undefined}><dt>Difference</dt><dd>{money.format(data.reconciliation.difference)}</dd></div><div data-alert={data.reconciliation.missingLedgerCount > 0 || undefined}><dt>Payments missing ledger entry</dt><dd>{data.reconciliation.missingLedgerCount}</dd></div></dl></section>
    </div>
  </div>;
}
