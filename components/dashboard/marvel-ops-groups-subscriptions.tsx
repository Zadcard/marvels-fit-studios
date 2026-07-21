"use client";

import { LoaderCircle, Plus, ReceiptText, X } from "lucide-react";
import React, { useState, useTransition, useMemo } from "react";
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
import { ReceiptModal } from "./receipt-modal";
import type { ReceiptSnapshot } from "@/lib/receipts/pdf-generator";

import styles from "./marvel-ops-groups-subscriptions.module.css";

export type MarvelOpsSubscriptionStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "accent" | "success" | "warning" | "neutral";
};

export type MarvelOpsSubscriptionClientOption = { id: string; label: string };

const subscriptionDurations = [
  { months: 1 as const, label: "1 Month" },
  { months: 3 as const, label: "Quarter (3 months)" },
];
const sessionsPerMonthChoices = [8, 12, 16, 20] as const;

type StatusFilterOption =
  | "All"
  | "Active"
  | "Expiring"
  | "Expired"
  | "Inactive"
  | "Upcoming"
  | "Session-based"
  | "Time-based";

type SortOption =
  | "expiry"
  | "name"
  | "newest"
  | "oldest"
  | "status"
  | "plan"
  | "coach";

function nearestSessionsChoice(value: number | undefined) {
  if (!value) return 12;
  return sessionsPerMonthChoices.reduce((closest, choice) =>
    Math.abs(choice - value) < Math.abs(closest - value) ? choice : closest,
  );
}

function nearestDurationMonths(value: number | undefined) {
  return value === 3 ? 3 : 1;
}

export type MarvelOpsSubscriptionGroupOption = {
  id: string;
  name: string;
  trainingCategory: string;
  coachName: string;
  scheduleSummary: string;
};

export function MarvelOpsSubscriptions({
  stats,
  records,
  clientOptions = [],
  groupOptions = [],
}: {
  stats: MarvelOpsSubscriptionStat[];
  records: AdminSubscriptionRecord[];
  clientOptions?: MarvelOpsSubscriptionClientOption[];
  groupOptions?: MarvelOpsSubscriptionGroupOption[];
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
  const [renewAmount, setRenewAmount] = useState("");
  const [renewSessionsPerMonth, setRenewSessionsPerMonth] =
    useState<(typeof sessionsPerMonthChoices)[number]>(12);
  const [renewDurationMonths, setRenewDurationMonths] =
    useState<(typeof subscriptionDurations)[number]["months"]>(1);

  const [renewNote, setRenewNote] = useState("");
  const [renewGroupId, setRenewGroupId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("All");
  const [sortBy, setSortBy] = useState<SortOption>("expiry");
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptSnapshot | null>(null);
  const [profileClientId, setProfileClientId] = useState<string | null>(null);

  const visibleRecords = useMemo(() => {
    let list = [...records];

    // Filter
    if (statusFilter !== "All") {
      list = list.filter((r) => {
        const label = subscriptionLabel(r);
        if (statusFilter === "Active") return label === "Active";
        if (statusFilter === "Expiring") return label === "Expiring";
        if (statusFilter === "Expired") return label === "Expired";
        if (statusFilter === "Inactive") return label === "Inactive";
        if (statusFilter === "Upcoming") return label === "Upcoming";
        if (statusFilter === "Session-based") return (r.sessionsTotal ?? 0) > 0;
        if (statusFilter === "Time-based") return (r.cycleMonths ?? 1) >= 1;
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.memberName.localeCompare(b.memberName);
      }
      if (sortBy === "expiry") {
        const dateA = a.renewalDateValue || "9999-99-99";
        const dateB = b.renewalDateValue || "9999-99-99";
        return dateA.localeCompare(dateB);
      }
      if (sortBy === "newest") {
        return b.id.localeCompare(a.id);
      }
      if (sortBy === "oldest") {
        return a.id.localeCompare(b.id);
      }
      if (sortBy === "status") {
        return subscriptionLabel(a).localeCompare(subscriptionLabel(b));
      }
      if (sortBy === "plan") {
        return a.planName.localeCompare(b.planName);
      }
      if (sortBy === "coach") {
        return (a.assignedCoach || "").localeCompare(b.assignedCoach || "");
      }
      return 0;
    });

    return list;
  }, [records, statusFilter, sortBy]);

  const confirmMutation = () => {
    if (!selected) return;

    // Both Reactivate and Renew use the same "renew" action so the full
    // payment form is always shown and the group can be updated either way.
    const action = "renew";
    setError("");

    startTransition(async () => {
      try {
        const result = await mutateAdminSubscriptionLifecycle(
          selected.id,
          action,
          paymentMethod,
          {
            amount: renewAmount,
            sessionsPerMonth: renewSessionsPerMonth,
            durationMonths: renewDurationMonths,
            note: renewNote.trim() || undefined,
            newGroupId: renewGroupId ?? undefined,
          },
        );
        setMessage(result.message);
        setSelected(null);
        setRenewNote("");
        setRenewGroupId(null);
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

  function openReceiptModal(record: AdminSubscriptionRecord) {
    const payment = record.paymentHistory[0];
    const rawNumber = payment?.receiptId
      ? `MFS-REC-${payment.receiptId.slice(0, 8).toUpperCase()}`
      : `MFS-REC-${record.id.slice(0, 8).toUpperCase()}`;

    // Calculate actual subscription start and end dates for window
    let startsAtStr = record.renewalDateValue || null;
    let endsAtStr = record.renewalDateValue || null;

    if (record.renewalDateValue) {
      const startD = new Date(`${record.renewalDateValue}T00:00:00`);
      startsAtStr = startD.toISOString();
      const endD = new Date(startD);
      endD.setMonth(endD.getMonth() + (record.cycleMonths || 1));
      endsAtStr = endD.toISOString();
    }

    const snapshot: ReceiptSnapshot = {
      receiptNumber: rawNumber,
      clientId: record.clientId,
      clientName: record.memberName,
      clientPhone: "",
      subscriptionId: record.id,
      amount: Number(record.amountValue) || 0,
      currency: "EGP",
      paymentMethod: payment?.method || "Cash",
      paymentDate: payment?.dateLabel || record.renewalDate || new Date().toISOString(),
      planName: record.planName,
      planType: record.billingCycle === "Weekly" ? "Weekly Coaching" : "Group Membership",
      billingCycle: record.billingCycle,
      durationMonths: record.cycleMonths || 1,
      sessionsIncluded: record.sessionsTotal || 12,
      startsAt: startsAtStr,
      endsAt: endsAtStr,
      coachName: record.assignedCoach,
      paymentStatus: record.paymentStatus === "Paid" ? "PAID" : "POSTED",
      note: payment?.note || (record.note !== "Latest payment is recorded." && record.note !== "Payment follow-up is still needed." ? record.note : undefined),
    };
    setViewingReceipt(snapshot);
  }

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
          <div className={styles.toolbar}>
            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterOption)}
              aria-label="Filter subscriptions by status or plan"
            >
              <option value="All">All subscriptions</option>
              <option value="Active">Active</option>
              <option value="Expiring">Expiring soon</option>
              <option value="Expired">Expired</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Session-based">Session-based</option>
              <option value="Time-based">Time-based</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort subscriptions"
            >
              <option value="expiry">Sort by Expiry Date</option>
              <option value="name">Sort by Member Name</option>
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
              <option value="status">Sort by Status</option>
              <option value="plan">Sort by Plan Type</option>
              <option value="coach">Sort by Coach</option>
            </select>

            {/* New Subscription Button - Always stays on one horizontal line */}
            <button
              type="button"
              className={styles.newSubBtn}
              onClick={() => setCreating(true)}
              disabled={pending}
            >
              <Plus size={14} /> New subscription
            </button>
          </div>
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
            onRenew={() => {
              setSelected(record);
              setPaymentMethod("InstaPay");
              setRenewAmount(record.amountValue);
              setRenewSessionsPerMonth(nearestSessionsChoice(record.sessionsTotal));
              setRenewDurationMonths(nearestDurationMonths(record.cycleMonths));
              setRenewGroupId(record.groupId ?? null);
              setError("");
            }}
            onReceipt={() => openReceiptModal(record)}
            onProfile={() => setProfileClientId(record.clientId)}
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
            <p>Change the filter or sorting options to view other subscriptions.</p>
          </article>
        </section>
      ) : null}
      {selected ? (
        <SubscriptionDialog
          record={selected}
          paymentMethod={paymentMethod}
          renewAmount={renewAmount}
          renewSessionsPerMonth={renewSessionsPerMonth}
          renewDurationMonths={renewDurationMonths}
          renewNote={renewNote}
          renewGroupId={renewGroupId}
          groupOptions={groupOptions}
          error={error}
          pending={pending}
          close={() => setSelected(null)}
          confirm={confirmMutation}
          onPaymentMethodChange={setPaymentMethod}
          onRenewAmountChange={setRenewAmount}
          onRenewSessionsPerMonthChange={setRenewSessionsPerMonth}
          onRenewDurationMonthsChange={setRenewDurationMonths}
          onRenewNoteChange={setRenewNote}
          onRenewGroupIdChange={setRenewGroupId}
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

      {/* In-App Receipt Modal */}
      <ReceiptModal
        open={!!viewingReceipt}
        onOpenChange={(open) => !open && setViewingReceipt(null)}
        receipt={viewingReceipt}
      />

      {/* Client Profile Sheet */}
      {profileClientId ? (() => {
        const profileRecord = records.find((r) => r.clientId === profileClientId) ?? null;
        return (
          <SubscriptionClientProfileSheet
            record={profileRecord}
            onClose={() => setProfileClientId(null)}
            onRenew={profileRecord ? () => {
              setProfileClientId(null);
              setSelected(profileRecord);
              setPaymentMethod("InstaPay");
              setRenewAmount(profileRecord.amountValue);
              setRenewSessionsPerMonth(nearestSessionsChoice(profileRecord.sessionsTotal));
              setRenewDurationMonths(nearestDurationMonths(profileRecord.cycleMonths));
              setRenewGroupId(profileRecord.groupId ?? null);
              setError("");
            } : undefined}
            onReceipt={profileRecord ? () => {
              setProfileClientId(null);
              openReceiptModal(profileRecord);
            } : undefined}
          />
        );
      })() : null}
    </div>
  );
}

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
  onRenew,
  onReceipt,
  onProfile,
}: {
  record: AdminSubscriptionRecord;
  pending: boolean;
  onRenew: () => void;
  onReceipt: () => void;
  onProfile: () => void;
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
  const paymentMethod = record.paymentHistory[0]?.method;
  const methodTone =
    paymentMethod === "Cash"
      ? styles.cash
      : paymentMethod === "Visa"
        ? styles.visa
        : styles.insta;
  const isInactive = status === "Inactive";
  const renewActionLabel =
    status === "Inactive" || status === "Expired" ? "Reactivate" : "Renew";

  return (
    <article data-inactive={isInactive || undefined}>
      <span>
        <button type="button" className={styles.memberNameBtn} onClick={onProfile}>
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
        </button>
        {status === "Upcoming" && (
          <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 99, border: "1px solid rgba(59,130,246,.35)", background: "rgba(59,130,246,.1)", color: "#3b82f6", fontSize: "0.5rem", fontFamily: "var(--font-ops-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
            Pre-renewed
          </span>
        )}
      </span>
      <span>
        {record.planName.replace(" Membership", "").replace(" Coaching", "")}
        <small>
          {record.amountLabel} · {record.billingCycle}
        </small>
      </span>
      <span className={styles.sessions}>
        <div className={styles.sessionsTop}>
          <strong className={sessionTone}>{sessionsLeft}</strong>
          <small>of {sessionsTotal}</small>
        </div>
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
          status === "Expired" || status === "Inactive"
            ? styles.red
            : status === "Expiring"
              ? styles.amber
              : undefined
        }
      >
        {renewalLabel(record)}
        <small>{record.renewalDate}</small>
      </span>
      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.renewBtn}
          onClick={onRenew}
          disabled={pending}
        >
          {pending ? <LoaderCircle size={12} className={styles.spinner} /> : null}
          {renewActionLabel}
        </button>
        <button
          type="button"
          className={styles.receiptActionBtn}
          onClick={onReceipt}
        >
          <ReceiptText size={12} /> Receipt
        </button>
      </div>
    </article>
  );
}

function SubscriptionDialog({
  record,
  paymentMethod,
  renewAmount,
  renewSessionsPerMonth,
  renewDurationMonths,
  renewNote,
  renewGroupId,
  groupOptions,
  error,
  pending,
  close,
  confirm,
  onPaymentMethodChange,
  onRenewAmountChange,
  onRenewSessionsPerMonthChange,
  onRenewDurationMonthsChange,
  onRenewNoteChange,
  onRenewGroupIdChange,
}: {
  record: AdminSubscriptionRecord;
  paymentMethod: AdminPaymentMethod;
  renewAmount: string;
  renewSessionsPerMonth: (typeof sessionsPerMonthChoices)[number];
  renewDurationMonths: (typeof subscriptionDurations)[number]["months"];
  renewNote: string;
  renewGroupId: string | null;
  groupOptions: MarvelOpsSubscriptionGroupOption[];
  error: string;
  pending: boolean;
  close: () => void;
  confirm: () => void;
  onPaymentMethodChange: (method: AdminPaymentMethod) => void;
  onRenewAmountChange: (value: string) => void;
  onRenewSessionsPerMonthChange: (value: (typeof sessionsPerMonthChoices)[number]) => void;
  onRenewDurationMonthsChange: (value: (typeof subscriptionDurations)[number]["months"]) => void;
  onRenewNoteChange: (value: string) => void;
  onRenewGroupIdChange: (id: string | null) => void;
}) {
  const status = subscriptionLabel(record);
  const action = status === "Inactive" || status === "Expired" ? "Reactivate" : "Renew";

  // Derive unique categories from available groups
  const categories = Array.from(new Set(groupOptions.map((g) => g.trainingCategory))).sort();
  // Find which category the currently selected group belongs to
  const selectedGroup = groupOptions.find((g) => g.id === renewGroupId) ?? null;
  const currentCategory = selectedGroup?.trainingCategory ?? record.category ?? categories[0] ?? "";
  const [pickedCategory, setPickedCategory] = React.useState<string>(currentCategory);
  const groupsInCategory = groupOptions.filter((g) => g.trainingCategory === pickedCategory);
  const groupChanged = renewGroupId !== record.groupId;

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
              ? "Record the payment method and schedule the renewal. Early renewals will be queued for the next period without losing remaining days/sessions."
              : "Record the payment to reactivate this membership. You can also change the member's group at the same time."}
          </p>

          {/* Amount */}
          <label>
            Amount (EGP)
            <input
              inputMode="decimal"
              value={renewAmount}
              onChange={(event) => onRenewAmountChange(event.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
          </label>

          {/* Duration */}
          <fieldset className={styles.paymentChoices} disabled={pending}>
            <legend>Duration</legend>
            <div className={styles.chips}>
              {subscriptionDurations.map((duration) => (
                <button
                  key={duration.months}
                  type="button"
                  data-active={renewDurationMonths === duration.months || undefined}
                  aria-pressed={renewDurationMonths === duration.months}
                  onClick={() => onRenewDurationMonthsChange(duration.months)}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Sessions */}
          <fieldset className={styles.paymentChoices} disabled={pending}>
            <legend>Sessions per month</legend>
            <div className={styles.chips}>
              {sessionsPerMonthChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  data-active={renewSessionsPerMonth === choice || undefined}
                  aria-pressed={renewSessionsPerMonth === choice}
                  onClick={() => onRenewSessionsPerMonthChange(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Payment method */}
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

          {/* Group / Category picker — only shown when groups are available */}
          {groupOptions.length > 0 && (
            <fieldset className={styles.paymentChoices} disabled={pending}>
              <legend>
                Group{" "}
                {record.groupName ? (
                  <span style={{ opacity: 0.55, fontWeight: 400 }}>
                    · currently {record.groupName}
                  </span>
                ) : null}
                {groupChanged && (
                  <span style={{ marginLeft: 6, color: "#f59e0b", fontSize: "0.5rem", fontFamily: "var(--font-ops-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Changed
                  </span>
                )}
              </legend>

              {/* Step 1 — Category chips */}
              <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={styles.chips}
                    style={{
                      padding: "4px 11px",
                      borderRadius: 8,
                      fontSize: "0.58rem",
                      fontFamily: "var(--font-ops-mono)",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: pickedCategory === cat ? "1px solid #e62429" : "1px solid #3a3a3a",
                      background: pickedCategory === cat ? "rgba(230,36,41,0.12)" : "transparent",
                      color: pickedCategory === cat ? "#ff4f54" : "#8f8f8f",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => setPickedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Step 2 — Groups within selected category */}
              <div className={styles.chips} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {groupsInCategory.length === 0 ? (
                  <span style={{ color: "#8f8f8f", fontSize: "0.58rem", fontFamily: "var(--font-ops-mono)" }}>
                    No groups in this category
                  </span>
                ) : (
                  groupsInCategory.map((group) => {
                    const isSelected = renewGroupId === group.id;
                    const isCurrent = record.groupId === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        data-active={isSelected || undefined}
                        aria-pressed={isSelected}
                        onClick={() => onRenewGroupIdChange(group.id)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: "8px 12px",
                          gap: 2,
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                          <span>{group.name}</span>
                          {isCurrent && (
                            <span style={{ fontSize: "0.45rem", fontFamily: "var(--font-ops-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#25d366", padding: "1px 5px", borderRadius: 5, border: "1px solid rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.08)", whiteSpace: "nowrap" }}>
                              Current
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: "0.5rem", fontFamily: "var(--font-ops-mono)", color: "#8f8f8f", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                          {group.coachName} · {group.scheduleSummary}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </fieldset>
          )}

          {/* Note */}
          <label>
            Note (Optional)
            <input
              type="text"
              value={renewNote}
              onChange={(event) => onRenewNoteChange(event.target.value)}
              placeholder="e.g. Paid in full via InstaPay transfer"
              disabled={pending}
            />
          </label>

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
              disabled={pending || !renewAmount.trim()}
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

function subscriptionLabel(record: AdminSubscriptionRecord): "Active" | "Expiring" | "Expired" | "Inactive" | "Upcoming" | "Trial" {
  if (record.subscriptionStatus === "Pending renewal" && record.note.toLowerCase().includes("upcoming")) return "Upcoming";
  if (record.subscriptionStatus === "Trial") return "Trial";
  if (record.subscriptionStatus === "Paused" || record.subscriptionStatus === "Canceled") {
    return "Inactive";
  }

  if (record.renewalDateValue) {
    const diffDays = Math.ceil(
      (new Date(`${record.renewalDateValue}T00:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 7) {
      return "Active";
    }
    if (diffDays >= 0 && diffDays <= 7) {
      return "Expiring";
    }
    if (diffDays < 0 && diffDays >= -7) {
      return "Expired";
    }
    if (diffDays < -7) {
      return "Inactive";
    }
  }

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

function SubscriptionClientProfileSheet({
  record,
  onClose,
  onRenew,
  onReceipt,
}: {
  record: AdminSubscriptionRecord | null;
  onClose: () => void;
  onRenew?: () => void;
  onReceipt?: () => void;
}) {
  if (!record) return null;
  const status = subscriptionLabel(record);
  const sessionsLeft = Math.max(0, record.sessionsLeft ?? 0);
  const sessionsTotal = Math.max(1, record.sessionsTotal ?? 1);
  const sessionPct = Math.min(100, (sessionsLeft / sessionsTotal) * 100);
  const initials = record.memberName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const lastPayment = record.paymentHistory[0];
  const statusColor =
    status === "Active" ? "#25d366"
    : status === "Expiring" ? "#f59e0b"
    : status === "Expired" || status === "Inactive" ? "#ef4444"
    : status === "Upcoming" ? "#3b82f6"
    : "#8f8f8f";

  const sheetStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  };
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
  };
  const drawerStyle: React.CSSProperties = {
    position: "relative",
    width: "min(420px, 100vw)",
    height: "100dvh",
    overflowY: "auto",
    background: "#111",
    borderLeft: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  };
  const headerStyle: React.CSSProperties = {
    padding: "28px 24px 20px",
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };
  const avatarStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#e62429,#ff4f54)",
    display: "grid",
    placeItems: "center",
    color: "#fff",
    fontFamily: "var(--font-ops-display)",
    fontWeight: 700,
    fontSize: "1.05rem",
    flexShrink: 0,
  };
  const pillStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 99,
    border: `1px solid ${statusColor}55`,
    background: `${statusColor}18`,
    color: statusColor,
    fontFamily: "var(--font-ops-mono)",
    fontWeight: 700,
    fontSize: "0.52rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  };

  return (
    <div style={sheetStyle}>
      <div style={overlayStyle} onClick={onClose} />
      <div style={drawerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={avatarStyle}>{initials}</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", fontFamily: "var(--font-ops-display)" }}>{record.memberName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <span style={pillStyle}>{status}</span>
                  <span style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{record.billingCycle}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ alignSelf: "flex-start", width: 30, height: 30, border: "1px solid #3a3a3a", borderRadius: 9, background: "transparent", color: "#8f8f8f", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "0.85rem" }}
            >
              ✕
            </button>
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {onRenew && (
              <button type="button" onClick={onRenew} style={{ flex: 1, minHeight: 36, border: 0, borderRadius: 9, background: "linear-gradient(135deg,#e62429,#ff4f54)", color: "#fff", fontFamily: "var(--font-ops-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                {status === "Inactive" || status === "Expired" ? "Reactivate" : "Renew"}
              </button>
            )}
            {onReceipt && (
              <button type="button" onClick={onReceipt} style={{ flex: 1, minHeight: 36, border: "1px solid #3a3a3a", borderRadius: 9, background: "#171717", color: "#c4c4c4", fontFamily: "var(--font-ops-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                View Receipt
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "18px 24px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {/* Sessions */}
            <div style={{ padding: "14px 16px", border: "1px solid #2a2a2a", borderRadius: 14, background: "#0d0d0d", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.14em" }}>Sessions left</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <strong style={{ color: sessionsLeft <= 2 ? "#ef4444" : "#25d366", fontFamily: "var(--font-ops-impact)", fontSize: "1.6rem" }}>{sessionsLeft}</strong>
                <span style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.52rem" }}>of {sessionsTotal}</span>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: "#1c1c1c", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${sessionPct}%`, background: sessionsLeft <= 2 ? "linear-gradient(90deg,#e62429,#ff4f54)" : "linear-gradient(90deg,#25d366,#14b8a6)", borderRadius: 99 }} />
              </div>
            </div>
            {/* Renewal */}
            <div style={{ padding: "14px 16px", border: "1px solid #2a2a2a", borderRadius: 14, background: "#0d0d0d", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.14em" }}>Renewal</span>
              <div style={{ color: status === "Expired" || status === "Inactive" ? "#ef4444" : status === "Expiring" ? "#f59e0b" : "#fff", fontFamily: "var(--font-ops-display)", fontWeight: 700, fontSize: "0.82rem" }}>
                {renewalLabel(record)}
              </div>
              <div style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.5rem" }}>{record.renewalDate}</div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid #2a2a2a", borderRadius: 14, background: "#0d0d0d", overflow: "hidden", marginBottom: 20 }}>
            {[
              ["Plan", record.planName.replace(" Membership", "").replace(" Coaching", "")],
              ["Amount", record.amountLabel],
              ["Coach", record.assignedCoach || "Unassigned"],
              ["Last Payment", lastPayment ? `${lastPayment.amountLabel} · ${lastPayment.dateLabel}` : "No payments"],
              ["Last Method", lastPayment?.method ?? "—"],
            ].map(([label, value], i, arr) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                <span style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
                <span style={{ color: "#fff", fontFamily: "var(--font-ops-body, sans-serif)", fontSize: "0.72rem", fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Payment history */}
          {record.paymentHistory.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Payment history</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {record.paymentHistory.slice(0, 5).map((ph) => (
                  <div key={ph.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid #2a2a2a", borderRadius: 10, background: "#0a0a0a" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ color: "#25d366", fontFamily: "var(--font-ops-mono)", fontWeight: 700, fontSize: "0.65rem" }}>{ph.amountLabel}</span>
                      {ph.note && <span style={{ color: "#8f8f8f", fontSize: "0.55rem" }}>{ph.note}</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ color: "#8f8f8f", fontFamily: "var(--font-ops-mono)", fontSize: "0.52rem" }}>{ph.dateLabel}</span>
                      {ph.method && <span style={{ color: "#c4c4c4", fontFamily: "var(--font-ops-mono)", fontSize: "0.5rem", padding: "2px 6px", border: "1px solid #3a3a3a", borderRadius: 6 }}>{ph.method}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
