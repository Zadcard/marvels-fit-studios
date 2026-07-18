"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, CircleSlash2, LoaderCircle, ReceiptText } from "lucide-react";

import { mutateAdminSubscriptionLifecycle } from "@/app/actions/admin-subscriptions";
import type { AdminSubscriptionRecord } from "@/lib/mocks/admin-subscriptions";
import styles from "./admin-subscriptions-workspace.module.css";

type Stat = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "accent" | "success" | "warning" | "neutral";
};

type Props = { stats: Stat[]; records: AdminSubscriptionRecord[] };

function toneFor(record: AdminSubscriptionRecord) {
  if (record.subscriptionStatus === "Active") return "success";
  if (record.subscriptionStatus === "Pending renewal") return "warning";
  if (["Paused", "Canceled"].includes(record.subscriptionStatus)) return "danger";
  return "info";
}

export function AdminSubscriptionsWorkspace({ stats, records }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  function mutate(record: AdminSubscriptionRecord) {
    const action = record.subscriptionStatus === "Paused" ? "resume" : "renew";
    setActiveId(record.id);
    setMessage("");
    startTransition(async () => {
      try {
        const result = await mutateAdminSubscriptionLifecycle(record.id, action);
        setMessage(result.message);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Subscription update failed.");
      } finally {
        setActiveId(null);
      }
    });
  }

  const transactions = records
    .flatMap((record) => record.paymentHistory.map((payment) => ({ ...payment, memberName: record.memberName })))
    .slice(0, 6);
  const collected = stats.find((item) => item.id === "collected")?.value ?? "EGP 0";

  return (
    <div className={styles.page} aria-busy={pending}>
      <section className={styles.metrics} aria-label="Subscription summary">
        {stats.map((stat) => <article key={stat.id} data-tone={stat.tone}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.change}</small></article>)}
      </section>
      {message ? <p className={styles.notice} role="status">{message}</p> : null}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <header><h2>Members & renewals</h2><span>Expiring first</span></header>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Member</th><th>Plan</th><th>Payment</th><th>Renews</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{records.length ? records.map((record) => (
                <tr key={record.id}>
                  <td><span className={styles.avatar}>{record.memberName.split(/\s+/).slice(0,2).map((part) => part[0]).join("")}</span><span><strong>{record.memberName}</strong><small data-tone={toneFor(record)}>{record.subscriptionStatus}</small></span></td>
                  <td><strong>{record.planName}</strong><small>{record.amountLabel} · {record.billingCycle}</small></td>
                  <td><span className={styles.payment} data-tone={record.paymentStatus === "Paid" ? "success" : "warning"}>{record.paymentStatus}</span></td>
                  <td><strong>{record.renewalDate}</strong><small>{record.note}</small></td>
                  <td>{record.paymentStatus === "Paid" && record.paymentHistory[0]?.receiptId ? (
                    <a className={styles.receipt} href={`/api/receipts/${record.paymentHistory[0].receiptId}`}><ReceiptText size={14} /> Receipt</a>
                  ) : (
                    <button type="button" onClick={() => mutate(record)} disabled={pending}>{activeId === record.id ? <LoaderCircle size={14} className="animate-spin-slow" /> : null}{record.subscriptionStatus === "Paused" ? "Reactivate" : "Renew"}</button>
                  )}</td>
                </tr>
              )) : <tr><td colSpan={5} className={styles.empty}>No subscription records found.</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <aside className={styles.side}>
          <section className={styles.panel}>
            <header><h2>Cash flow · this month</h2></header>
            <div className={styles.cashGrid}><article><span>Cash in</span><strong>{collected}</strong></article><article data-disabled><span>Cash out</span><strong>Not tracked</strong></article></div>
            <div className={styles.net}><span>Net this month</span><strong>{collected}</strong><small>Operating expenses require a dedicated expense ledger.</small></div>
          </section>
          <section className={styles.panel}>
            <header><h2>Recent transactions</h2></header>
            {transactions.length ? <div className={styles.transactions}>{transactions.map((transaction) => (
              <article key={transaction.id}><i><ArrowDown size={13} /></i><span><strong>{transaction.memberName}</strong><small>{transaction.dateLabel} · {transaction.note}</small></span><b>{transaction.amountLabel}</b></article>
            ))}</div> : <div className={styles.empty}><CircleSlash2 size={20} /> No payments recorded.</div>}
          </section>
        </aside>
      </div>
    </div>
  );
}
