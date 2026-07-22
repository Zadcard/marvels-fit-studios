"use client";

import { Ban, CalendarClock, Phone, Search, Trash2, UserRoundCheck, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { closeLeadAsLost, deleteLead, subscribeLeadFromTrial } from "@/app/actions/admin-leads";
import type { LapsedTrialRecord } from "@/lib/dashboard/admin-dashboard-data";
import { normalizeLeadSource } from "@/lib/dashboard/lead-source";
import { formatPhoneNumber } from "@/lib/phone-format";
import { adminPaymentMethods } from "@/lib/mocks/admin-subscriptions";
import { EntityDialog, EntityForm, FormActions, FormField } from "@/components/ui/entity-form";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-lapsed-trials-workspace.module.css";

const sessionChoices = [8, 12, 16, 20] as const;
type LeadGroup = { id: string; name: string; categoryId: string };

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function urgencyTone(days: number): "fresh" | "due" | "urgent" {
  if (days >= 14) return "urgent";
  if (days >= 7) return "due";
  return "fresh";
}

export function AdminLapsedTrialsWorkspace({
  records,
  totalCount,
  trialGroups,
}: {
  records: LapsedTrialRecord[];
  totalCount: number;
  trialGroups: LeadGroup[];
}) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [search, setSearch] = useState("");
  const [subscribing, setSubscribing] = useState<LapsedTrialRecord | null>(null);
  const [losing, setLosing] = useState<LapsedTrialRecord | null>(null);
  const [deleting, setDeleting] = useState<LapsedTrialRecord | null>(null);
  const [pending, startTransition] = useTransition();

  const urgentCount = records.filter((lead) => urgencyTone(lead.daysSinceTrial) === "urgent").length;
  const avgDays = totalCount
    ? Math.round(records.reduce((sum, lead) => sum + lead.daysSinceTrial, 0) / totalCount)
    : 0;

  const term = search.trim().toLowerCase();
  const shown = useMemo(() => {
    return records.filter((lead) => {
      if (!term) return true;
      return [lead.fullName, lead.phone, lead.email, lead.source, lead.trialGroupName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [records, term]);

  function subscribeLead(input: {
    groupId: string;
    durationMonths: 1 | 3;
    sessionsPerMonth: (typeof sessionChoices)[number];
    price: string;
    paymentMethod: (typeof adminPaymentMethods)[number];
  }) {
    if (!subscribing) return;
    startTransition(async () => {
      try {
        await subscribeLeadFromTrial({ leadId: subscribing.id, ...input });
        showToast(`${subscribing.fullName} subscribed. Receipt recorded.`);
        setSubscribing(null);
        router.refresh();
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : "Could not create the subscription.", "warning");
      }
    });
  }

  function markLost(reason: string) {
    if (!losing) return;
    startTransition(async () => {
      try {
        await closeLeadAsLost(losing.id, reason);
        showToast(`${losing.fullName} marked as lost.`);
        setLosing(null);
        router.refresh();
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : "Could not update the lead.", "warning");
      }
    });
  }

  function removeLead() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      try {
        await deleteLead(target.id);
        showToast(`${target.fullName} was removed.`);
        setDeleting(null);
        router.refresh();
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : "The lead could not be deleted.", "warning");
      }
    });
  }

  return (
    <div className={styles.wrap} aria-busy={pending}>
      <section className={styles.stats}>
        <article>
          <span><CalendarClock size={15} /> Lapsed trials</span>
          <strong>{totalCount}</strong>
          <small>Attended, no decision yet</small>
        </article>
        <article data-tone="urgent">
          <span><Ban size={15} /> 14+ days quiet</span>
          <strong>{urgentCount}</strong>
          <small>Needs a follow-up call</small>
        </article>
        <article data-tone="avg">
          <span>Average days since trial</span>
          <strong>{avgDays}</strong>
        </article>
      </section>

      <div className={styles.topRow}>
        <label className={styles.search}>
          <span className={styles.searchIcon}><Search size={14} /></span>
          <span className="sr-only">Search lapsed trials</span>
          <input className={styles.searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, or group" />
        </label>
      </div>

      <div className={styles.tableScroll}>
        <div className={styles.table}>
          <div className={styles.head}>
            <span />
            <span className={styles.colLabel}>Lead</span>
            <span className={styles.colLabel}>Source</span>
            <span className={styles.colLabel}>Trial group</span>
            <span className={styles.colLabel}>Since trial</span>
            <span className={styles.colLabel}>Action</span>
            <span className={styles.actionLabel}>Lost</span>
            <span />
          </div>

          {shown.length === 0 ? (
            <div className={styles.empty}>
              <CalendarClock size={30} />
              <h2>{totalCount ? "No leads match this search" : "No lapsed trials"}</h2>
              <p>{totalCount ? "Clear the search to see the full list." : "Leads who attend a trial and don't return will show up here for follow-up."}</p>
            </div>
          ) : null}

          {shown.map((lead) => {
            const tone = urgencyTone(lead.daysSinceTrial);
            return (
              <div key={lead.id} className={styles.row} data-tone={tone}>
                <span className={styles.accent} data-tone={tone} />
                <div className={styles.leadCell}>
                  <span className={styles.avatar}>{initials(lead.fullName)}</span>
                  <span className={styles.minCol}>
                    <span className={styles.name}>{lead.fullName}</span>
                    <span className={styles.note}>{lead.interestedCategory ?? "No category"}</span>
                  </span>
                </div>
                <div className={styles.pad}>
                  <span className={styles.sourcePill} data-source={normalizeLeadSource(lead.source)}>{normalizeLeadSource(lead.source)}</span>
                </div>
                <div className={styles.pad}>
                  <span className={styles.phone}><span className={styles.phoneIcon}><Phone size={12} aria-hidden="true" /></span>{formatPhoneNumber(lead.phone)}</span>
                  <span className={styles.groupName}>{lead.trialGroupName ?? "Unassigned"}</span>
                </div>
                <div className={styles.pad}>
                  <span className={styles.daysPill} data-tone={tone}>{lead.daysSinceTrial}d</span>
                  <span className={styles.trialDate}>since {lead.trialCompletedLabel}</span>
                </div>
                <div className={styles.actionPad}>
                  <button type="button" className={styles.subscribeBtn} disabled={pending} onClick={() => setSubscribing(lead)}>
                    <UserRoundCheck size={13} aria-hidden="true" /> Subscribe
                  </button>
                </div>
                <div className={styles.actionPad}>
                  <button type="button" className={styles.lostBtn} disabled={pending} onClick={() => setLosing(lead)}>Mark lost</button>
                </div>
                <div className={styles.rowTools}>
                  <button type="button" className={styles.delBtn} aria-label={`Delete ${lead.fullName}`} title={`Delete ${lead.fullName}`} disabled={pending} onClick={() => setDeleting(lead)}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {subscribing ? (
        <SubscribeLeadModal
          lead={subscribing}
          groups={trialGroups}
          pending={pending}
          close={() => setSubscribing(null)}
          submit={subscribeLead}
        />
      ) : null}
      {losing ? <LostReasonModal lead={losing} pending={pending} close={() => setLosing(null)} submit={markLost} /> : null}
      {deleting ? (
        <EntityDialog open onOpenChange={(open) => !open && !pending && setDeleting(null)} title={`Delete ${deleting.fullName}?`} description="This permanently removes the lead record. This cannot be undone." closeLabel="Close delete confirmation" size="small">
          <div className={styles.deleteActions}>
            <button type="button" className="mv-btn mv-btn-secondary" onClick={() => setDeleting(null)} disabled={pending}>Cancel</button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={removeLead} disabled={pending}>{pending ? "Deleting…" : "Delete lead"}<Trash2 size={14} /></button>
          </div>
        </EntityDialog>
      ) : null}
    </div>
  );
}

function SubscribeLeadModal({ lead, groups, pending, close, submit }: {
  lead: LapsedTrialRecord;
  groups: LeadGroup[];
  pending: boolean;
  close: () => void;
  submit: (input: {
    groupId: string;
    durationMonths: 1 | 3;
    sessionsPerMonth: (typeof sessionChoices)[number];
    price: string;
    paymentMethod: (typeof adminPaymentMethods)[number];
  }) => void;
}) {
  const availableGroups = groups.filter((group) => group.categoryId === lead.categoryId);
  const [groupId, setGroupId] = useState(lead.trialGroupId ?? availableGroups[0]?.id ?? "");
  const [durationMonths, setDurationMonths] = useState<1 | 3>(1);
  const [sessionsPerMonth, setSessionsPerMonth] = useState<(typeof sessionChoices)[number]>(8);
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof adminPaymentMethods)[number]>("Cash");

  return (
    <EntityDialog open onOpenChange={(open) => !open && !pending && close()} title={`Subscribe ${lead.fullName}`} description={`Convert ${lead.fullName} into an active member, record the payment, and create the first subscription receipt.`} closeLabel="Close subscription form">
      <EntityForm onSubmit={(event) => { event.preventDefault(); submit({ groupId, durationMonths, sessionsPerMonth, price, paymentMethod }); }}>
        <FormField label="Amount (EGP)" full><input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" disabled={pending} required /></FormField>
        <fieldset className={styles.choicesFieldset} disabled={pending}><legend>Duration</legend><div className={styles.choiceChips}>{([{ months: 1, label: "1 month" }, { months: 3, label: "3 months" }] as const).map((duration) => <button key={duration.months} type="button" data-active={durationMonths === duration.months || undefined} aria-pressed={durationMonths === duration.months} onClick={() => setDurationMonths(duration.months)}>{duration.label}</button>)}</div></fieldset>
        <fieldset className={styles.choicesFieldset} disabled={pending}><legend>Sessions per month</legend><div className={styles.choiceChips}>{sessionChoices.map((value) => <button key={value} type="button" data-active={sessionsPerMonth === value || undefined} aria-pressed={sessionsPerMonth === value} onClick={() => setSessionsPerMonth(value)}>{value}</button>)}</div></fieldset>
        <fieldset className={styles.choicesFieldset} disabled={pending}><legend>Paid with</legend><div className={styles.choiceChips}>{adminPaymentMethods.map((method) => <button key={method} type="button" data-active={paymentMethod === method || undefined} aria-pressed={paymentMethod === method} onClick={() => setPaymentMethod(method)}>{method}</button>)}</div></fieldset>
        <fieldset className={styles.choicesFieldset} disabled={pending}><legend>Group</legend><div className={styles.groupChoices}>{availableGroups.map((group) => <button key={group.id} type="button" data-active={groupId === group.id || undefined} aria-pressed={groupId === group.id} onClick={() => setGroupId(group.id)}><span>{group.name}</span>{group.id === lead.trialGroupId ? <small>Trial group</small> : null}</button>)}</div></fieldset>
        <FormActions onCancel={close} submitLabel="Subscribe" pendingLabel="Saving…" pending={pending} disabled={!groupId || !price.trim()} />
      </EntityForm>
    </EntityDialog>
  );
}

function LostReasonModal({ lead, pending, close, submit }: { lead: LapsedTrialRecord; pending: boolean; close: () => void; submit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <EntityDialog open onOpenChange={(open) => !open && close()} title={`Mark ${lead.fullName} as lost?`} description="The lead record is kept for reporting; this closes the pipeline card." closeLabel="Close lost lead form" size="small">
      <EntityForm onSubmit={(event) => { event.preventDefault(); submit(reason); }}>
        <FormField label="Reason (optional)" full><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Stopped responding" /></FormField>
        <FormActions onCancel={close} submitLabel="Mark lost" pendingLabel="Saving…" pending={pending} />
      </EntityForm>
    </EntityDialog>
  );
}
