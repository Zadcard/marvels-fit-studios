"use client";

import { LoaderCircle, Plus, ReceiptText, Search, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";

import {
  createAdminSubscription,
  mutateAdminSubscriptionLifecycle,
} from "@/app/actions/admin-subscriptions";
import {
  adminPaymentMethods,
  type AdminPaymentMethod,
  type AdminSubscriptionRecord,
} from "@/lib/mocks/admin-subscriptions";

import { useDashboardToast } from "./dashboard-toast-provider";

import styles from "./marvel-ops-groups-subscriptions.module.css";

export type MarvelOpsSubscriptionStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type MarvelOpsSubscriptionClientOption = { id: string; label: string };

export function MarvelOpsSubscriptions({
  stats,
  records,
  clientOptions = [],
}: {
  stats: MarvelOpsSubscriptionStat[];
  records: AdminSubscriptionRecord[];
  clientOptions?: MarvelOpsSubscriptionClientOption[];
}) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AdminSubscriptionRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<AdminPaymentMethod>("InstaPay");
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const visibleRecords = term
    ? records.filter((record) =>
        [record.memberName, record.planName].join(" ").toLowerCase().includes(term),
      )
    : records;

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
        showToast(result.message);
        router.refresh();
      } catch (reason) {
        const description = reason instanceof Error
          ? reason.message
          : "The subscription could not be updated.";
        setError(description);
        showToast(description, "warning");
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
          <label className={styles.search}>
            <Search size={16} />
            <span className="sr-only">Search members</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Member or plan" />
          </label>
          <button type="button" onClick={() => setCreating(true)} disabled={pending}>
            <Plus size={13} /> New subscription
          </button>
        </header>
        <div className={styles.head}>
          <span>Member</span>
          <span>Plan</span>
          <span>Sessions left</span>
          <span>Method</span>
          <span>Renews</span>
          <span>Action</span>
        </div>
        {visibleRecords.map((record) => (
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
      ) : !visibleRecords.length ? (
        <section className={styles.money}>
          <article>
            <h2>No matches</h2>
            <p>Change the search to find a different member or plan.</p>
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
      {creating ? (
        <NewSubscriptionDialog
          clientOptions={clientOptions}
          close={() => setCreating(false)}
          onCreated={(text) => {
            setCreating(false);
            setMessage(text);
            showToast(text);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

const subscriptionDurations = [
  { months: 1 as const, label: "1 Month" },
  { months: 3 as const, label: "Quarter (3 months)" },
];
const sessionsPerMonthChoices = [8, 12, 16, 20] as const;

function NewSubscriptionDialog({
  clientOptions,
  close,
  onCreated,
}: {
  clientOptions: MarvelOpsSubscriptionClientOption[];
  close: () => void;
  onCreated: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState("");
  const [months, setMonths] = useState<(typeof subscriptionDurations)[number]["months"]>(1);
  const [sessionsPerMonth, setSessionsPerMonth] =
    useState<(typeof sessionsPerMonthChoices)[number]>(12);
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AdminPaymentMethod>("Cash");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    startTransition(async () => {
      try {
        await createAdminSubscription({
          clientId,
          durationMonths: months,
          sessionsPerMonth,
          price,
          paymentMethod,
        });
        onCreated("Subscription created and payment recorded.");
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "The subscription could not be created.",
        );
      }
    });
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && !pending && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.modal}>
          <Dialog.Close className={styles.close} disabled={pending} aria-label="Close">
            <X size={16} />
          </Dialog.Close>
          <span>Membership</span>
          <Dialog.Title asChild>
            <h2>New subscription</h2>
          </Dialog.Title>
          <Dialog.Description>
            Choose the member, duration, monthly sessions, and price.
          </Dialog.Description>
          <label>
            Member
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              disabled={pending}
            >
              <option value="">Select a member</option>
              {clientOptions.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className={styles.paymentChoices} disabled={pending}>
            <legend>Duration</legend>
            <div className={styles.chips}>
              {subscriptionDurations.map((duration) => (
                <button
                  key={duration.months}
                  type="button"
                  data-active={months === duration.months || undefined}
                  aria-pressed={months === duration.months}
                  onClick={() => setMonths(duration.months)}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.paymentChoices} disabled={pending}>
            <legend>Sessions per month</legend>
            <div className={styles.chips}>
              {sessionsPerMonthChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  data-active={sessionsPerMonth === choice || undefined}
                  aria-pressed={sessionsPerMonth === choice}
                  onClick={() => setSessionsPerMonth(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </fieldset>
          <p>
            {sessionsPerMonth * months} sessions assigned over {months === 1 ? "1 month" : "3 months"}.
          </p>
          <label>
            Price (EGP)
            <input
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
          </label>
          <fieldset className={styles.paymentChoices} disabled={pending}>
            <legend>Paid with</legend>
            <div className={styles.chips}>
              {adminPaymentMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  data-active={paymentMethod === method || undefined}
                  aria-pressed={paymentMethod === method}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </fieldset>
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
              onClick={submit}
              disabled={pending || !clientId || !price.trim()}
            >
              {pending ? (
                <>
                  <LoaderCircle size={14} className={styles.spinner} /> Saving
                </>
              ) : (
                "Create subscription"
              )}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
    <Dialog.Root
      open
      onOpenChange={(open) => !open && !pending && close()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.modal}>
          <Dialog.Close
            className={styles.close}
            disabled={pending}
            aria-label="Close"
          >
            <X size={16} />
          </Dialog.Close>
          <span>Membership</span>
          <Dialog.Title asChild>
            <h2>{action} membership</h2>
          </Dialog.Title>
          <Dialog.Description>
            {record.memberName} · {record.amountLabel} · {record.planName}
          </Dialog.Description>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
  if (difference < 0) {
    const elapsed = Math.abs(difference);
    return `${elapsed} ${elapsed === 1 ? "day" : "days"} ago`;
  }
  if (difference === 0) return "today";
  return `in ${difference} ${difference === 1 ? "day" : "days"}`;
}
