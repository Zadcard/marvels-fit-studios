"use client";

import { LoaderCircle, ReceiptText, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { mutateAdminSubscriptionLifecycle } from "@/app/actions/admin-subscriptions";
import {
  adminPaymentMethods,
  type AdminPaymentMethod,
  type AdminSubscriptionRecord,
} from "@/lib/mocks/admin-subscriptions";

import styles from "./marvel-ops-groups-subscriptions.module.css";

export type MarvelOpsSubscriptionStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "accent" | "success" | "warning" | "neutral";
};

export function MarvelOpsSubscriptions({
  stats,
  records,
}: {
  stats: MarvelOpsSubscriptionStat[];
  records: AdminSubscriptionRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AdminSubscriptionRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<AdminPaymentMethod>("InstaPay");

  const confirmMutation = () => {
    if (!selected) return;

    const action =
      subscriptionLabel(selected) === "Expired" ? "resume" : "renew";
    setError("");

    startTransition(async () => {
      try {
        const result = await mutateAdminSubscriptionLifecycle(
          selected.id,
          action,
          action === "renew" ? paymentMethod : undefined,
        );
        setMessage(result.message);
        setSelected(null);
        router.refresh();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "The subscription could not be updated.",
        );
      }
    });
  };

  return (
    <div className={styles.page} aria-busy={pending}>
      <section className={styles.metrics}>
        {stats.map((stat) => (
          <article key={stat.id}>
            <span>{stat.label}</span>
            <strong
              className={
                stat.tone === "success"
                  ? styles.green
                  : stat.tone === "warning"
                    ? styles.amber
                    : stat.tone === "neutral"
                      ? styles.red
                      : styles.blue
              }
            >
              {stat.value}
            </strong>
            <small>{stat.change}</small>
          </article>
        ))}
      </section>
      {message ? (
        <p className={styles.notice} role="status">
          {message}
        </p>
      ) : null}
      <section className={styles.table}>
        <header>
          <h2>Members &amp; renewals</h2>
          <span>Expiring first</span>
        </header>
        <div className={styles.head}>
          <span>Member</span>
          <span>Plan</span>
          <span>Sessions left</span>
          <span>Method</span>
          <span>Renews</span>
          <span />
        </div>
        {records.map((record) => (
          <SubscriptionRow
            key={record.id}
            record={record}
            pending={pending}
            onMutate={() => {
              setSelected(record);
              setPaymentMethod("InstaPay");
              setError("");
            }}
          />
        ))}
      </section>
      {!records.length ? (
        <section className={styles.money}>
          <article>
            <h2>No subscriptions yet</h2>
            <p>
              Seed or create client subscriptions in the database to populate
              this workspace.
            </p>
          </article>
        </section>
      ) : null}
      {selected ? (
        <SubscriptionDialog
          record={selected}
          paymentMethod={paymentMethod}
          error={error}
          pending={pending}
          close={() => setSelected(null)}
          confirm={confirmMutation}
          onPaymentMethodChange={setPaymentMethod}
        />
      ) : null}
    </div>
  );
}

function SubscriptionRow({
  record,
  pending,
  onMutate,
}: {
  record: AdminSubscriptionRecord;
  pending: boolean;
  onMutate: () => void;
}) {
  const status = subscriptionLabel(record);
  const sessionsLeft = Math.max(0, record.sessionsLeft ?? 0);
  const sessionsTotal = Math.max(1, record.sessionsTotal ?? 1);
  const sessionTone =
    sessionsLeft === 0
      ? styles.red
      : sessionsLeft <= 2
        ? styles.amber
        : styles.green;
  const receiptId = record.paymentHistory[0]?.receiptId;
  const paymentMethod = record.paymentHistory[0]?.method;
  const methodTone =
    paymentMethod === "Cash"
      ? styles.cash
      : paymentMethod === "Visa"
        ? styles.visa
        : styles.insta;
  const action = receiptId ? "Receipt" : status === "Expired" ? "Reactivate" : "Renew";

  return (
    <article>
      <span>
        <i>
          {record.memberName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </i>
        <b>
          {record.memberName}
          <small data-status={status}>{status}</small>
        </b>
      </span>
      <span>
        {record.planName.replace(" Membership", "").replace(" Coaching", "")}
        <small>
          {record.amountLabel} · {record.billingCycle}
        </small>
      </span>
      <span className={styles.sessions}>
        <strong className={sessionTone}>{sessionsLeft}</strong>
        <small>of {sessionsTotal}</small>
        <em>
          <b
            className={sessionTone}
            style={{ width: `${Math.min(100, (sessionsLeft / sessionsTotal) * 100)}%` }}
          />
        </em>
      </span>
      <span className={`${styles.method} ${methodTone}`}>
        {paymentMethod ?? "Pending"}
      </span>
      <span
        className={
          status === "Expired"
            ? styles.red
            : status === "Expiring"
              ? styles.amber
              : undefined
        }
      >
        {renewalLabel(record)}
        <small>{record.renewalDate}</small>
      </span>
      {receiptId ? (
        <a
          className={styles.receipt}
          href={`/api/receipts/${receiptId}`}
          target="_blank"
          rel="noreferrer"
        >
          <ReceiptText size={13} /> Receipt
        </a>
      ) : (
        <button type="button" onClick={onMutate} disabled={pending}>
          {pending ? <LoaderCircle size={13} className={styles.spinner} /> : null}
          {action}
        </button>
      )}
    </article>
  );
}

function SubscriptionDialog({
  record,
  paymentMethod,
  error,
  pending,
  close,
  confirm,
  onPaymentMethodChange,
}: {
  record: AdminSubscriptionRecord;
  paymentMethod: AdminPaymentMethod;
  error: string;
  pending: boolean;
  close: () => void;
  confirm: () => void;
  onPaymentMethodChange: (method: AdminPaymentMethod) => void;
}) {
  const action = subscriptionLabel(record) === "Expired" ? "Reactivate" : "Renew";

  return (
    <div className={styles.overlay} onMouseDown={() => !pending && close()}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className={styles.close}
          type="button"
          onClick={close}
          disabled={pending}
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <span>Membership</span>
        <h2 id="subscription-dialog-title">{action} membership</h2>
        <p>
          {record.memberName} · {record.amountLabel} · {record.planName}
        </p>
        <p>
          {action === "Renew"
            ? "Record the payment method, close the current period, and create a new active period."
            : "This reactivates the existing membership and sets its next renewal date."}
        </p>
        {action === "Renew" ? (
          <fieldset className={styles.paymentChoices} disabled={pending}>
            <legend>Paid with</legend>
            <div className={styles.chips}>
              {adminPaymentMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  data-active={paymentMethod === method || undefined}
                  aria-pressed={paymentMethod === method}
                  onClick={() => onPaymentMethodChange(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <footer>
          <button type="button" onClick={close} disabled={pending}>
            Cancel
          </button>
          <button
            className={styles.submit}
            type="button"
            onClick={confirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <LoaderCircle size={14} className={styles.spinner} /> Saving
              </>
            ) : (
              action
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

function subscriptionLabel(record: AdminSubscriptionRecord) {
  if (
    record.subscriptionStatus === "Paused" ||
    record.subscriptionStatus === "Canceled"
  ) {
    return "Expired";
  }
  if (record.subscriptionStatus === "Pending renewal") return "Expiring";
  if (record.subscriptionStatus === "Trial") return "Trial";
  return "Active";
}

function renewalLabel(record: AdminSubscriptionRecord) {
  if (!record.renewalDateValue) return "No renewal";
  const day = 24 * 60 * 60 * 1000;
  const difference = Math.round(
    (new Date(`${record.renewalDateValue}T12:00:00`).getTime() - Date.now()) /
      day,
  );
  if (difference < 0) return `${Math.abs(difference)} days ago`;
  if (difference === 0) return "today";
  return `in ${difference} days`;
}
