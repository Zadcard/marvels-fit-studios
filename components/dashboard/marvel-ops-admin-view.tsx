"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";

import {
  assignLeadTrial,
  closeLeadAsLost,
  completeLeadTrial,
  createAdminLead,
  deleteLead,
  subscribeLeadFromTrial,
} from "@/app/actions/admin-leads";
import { adminLeadSources, type AdminLeadSource } from "@/lib/dashboard/lead-source";
import { trainingCategoryLabels } from "@/lib/dashboard/client-domain-labels";
import { adminPaymentMethods } from "@/lib/mocks/admin-subscriptions";
import { AdminLeadsTableView } from "./admin-leads-table-view";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./marvel-ops-admin-view.module.css";

type View = "leads";
const stages = ["New", "Trial booked", "Trial done", "Won", "Lost"] as const;
type Stage = (typeof stages)[number];
export type MarvelOpsLead = {
  id: string;
  stage: Stage;
  name: string;
  initials: string;
  tone: string;
  source: AdminLeadSource;
  phone: string;
  wants: string;
  note: string;
  injury?: string;
  assigned?: string;
  trialGroupId?: string;
  preferredAvailability?: string;
  lostReason?: string;
};
const sessionChoices = [8, 12, 16, 20] as const;
type LeadGroup = { id: string; name: string };

export function MarvelOpsAdminView({ initialLeads = [], trialGroups = [] }: { view: View; initialLeads?: MarvelOpsLead[]; trialGroups?: LeadGroup[] }) {
  return <LeadsWorkspace records={initialLeads} trialGroups={trialGroups} />;
}

function LeadsWorkspace({ records, trialGroups }: { records: MarvelOpsLead[]; trialGroups: LeadGroup[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useDashboardToast();
  const [selected, setSelected] = useState<MarvelOpsLead | null>(null);
  const [leadForGroup, setLeadForGroup] = useState<MarvelOpsLead | null>(null);
  const [deleting, setDeleting] = useState<MarvelOpsLead | null>(null);
  const [creating, setCreating] = useState(false);
  const [subscribing, setSubscribing] = useState<MarvelOpsLead | null>(null);
  const [losing, setLosing] = useState<MarvelOpsLead | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setCreating(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    window.history.replaceState(
      null,
      "",
      params.size ? `${pathname}?${params.toString()}` : pathname,
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setSelected((current) =>
      current ? records.find((lead) => lead.id === current.id) ?? null : null,
    );
    setLeadForGroup((current) =>
      current ? records.find((lead) => lead.id === current.id) ?? null : null,
    );
    setDeleting((current) =>
      current ? records.find((lead) => lead.id === current.id) ?? null : null,
    );
    setSubscribing((current) =>
      current ? records.find((lead) => lead.id === current.id) ?? null : null,
    );
    setLosing((current) =>
      current ? records.find((lead) => lead.id === current.id) ?? null : null,
    );
  }, [records]);

  function removeLead() {
    if (!deleting) return;
    setNotice("");
    startTransition(async () => {
      try {
        await deleteLead(deleting.id);
        const success = `${deleting.name} was removed from the pipeline.`;
        setNotice(success);
        showToast(success);
        setDeleting(null);
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "The lead could not be deleted.";
        setNotice(description);
        showToast(description, "warning");
      }
    });
  }

  function progressLead(lead: MarvelOpsLead) {
    setNotice("");
    if (lead.stage === "New") { setLeadForGroup(lead); return; }
    if (lead.stage === "Trial done") { setSubscribing(lead); return; }
    startTransition(async () => {
      try {
        if (lead.stage === "Trial booked") {
          await completeLeadTrial(lead.id);
          const success = `${lead.name}'s trial is marked complete.`;
          setNotice(success);
          showToast(success);
          router.refresh();
        }
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "The lead could not be updated.";
        setNotice(description);
        showToast(description, "warning");
      }
    });
  }

  function subscribeLead(input: {
    groupId: string;
    durationMonths: 1 | 3;
    sessionsPerMonth: (typeof sessionChoices)[number];
    price: string;
    paymentMethod: (typeof adminPaymentMethods)[number];
  }) {
    if (!subscribing) return;
    setNotice("");
    startTransition(async () => {
      try {
        await subscribeLeadFromTrial({ leadId: subscribing.id, ...input });
        const success = `${subscribing.name} subscribed. Receipt recorded.`;
        setNotice(success);
        showToast(success);
        setSubscribing(null);
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not create the subscription.";
        setNotice(description);
        showToast(description, "warning");
      }
    });
  }

  function markLost(reason: string) {
    if (!losing) return;
    setNotice("");
    startTransition(async () => {
      try {
        await closeLeadAsLost(losing.id, reason);
        const success = `${losing.name} marked as lost.`;
        setNotice(success);
        showToast(success);
        setLosing(null);
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "Could not update the lead.";
        setNotice(description);
        showToast(description, "warning");
      }
    });
  }

  function assignGroup(groupId: string) {
    if (!leadForGroup) return;
    startTransition(async () => {
      try {
        await assignLeadTrial({ leadId: leadForGroup.id, groupId });
        const success = `${leadForGroup.name} is booked for a trial.`;
        setNotice(success);
        showToast(success);
        setLeadForGroup(null);
        router.refresh();
      } catch (caught) {
        const description = caught instanceof Error ? caught.message : "The trial could not be booked.";
        setNotice(description);
        showToast(description, "warning");
      }
    });
  }

  function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setNotice("");
    startTransition(async () => {
      try {
        await createAdminLead({
          fullName: String(values.get("fullName") ?? ""),
          phone: String(values.get("phone") ?? ""),
          email: String(values.get("email") ?? ""),
          source: String(values.get("source") ?? "Other"),
          message: String(values.get("message") ?? ""),
          interestedCategory: String(values.get("interestedCategory") ?? "") || undefined,
          preferredAvailability: String(values.get("preferredAvailability") ?? "") || undefined,
        });
        setCreating(false);
        setNotice("Lead added to the New column.");
        showToast("Lead added to the New column.");
        router.refresh();
      }
      catch (caught) { const description = caught instanceof Error ? caught.message : "The lead could not be added."; setNotice(description); showToast(description, "warning"); }
    });
  }

  return <div className={styles.page} aria-busy={pending}>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    <AdminLeadsTableView
      leads={records}
      pending={pending}
      onAdd={() => setCreating(true)}
      onProgress={progressLead}
      onDelete={(lead) => setDeleting(lead)}
      onMarkLost={(lead) => setLosing(lead)}
    />
    {selected ? <LeadDrawer lead={selected} close={() => setSelected(null)} /> : null}
    {leadForGroup ? <TrialGroupModal lead={leadForGroup} groups={trialGroups} pending={pending} close={() => setLeadForGroup(null)} submit={assignGroup} /> : null}
    {creating ? <CreateLeadModal pending={pending} close={() => setCreating(false)} submit={addLead} /> : null}
    {deleting ? <DeleteLeadModal lead={deleting} pending={pending} close={() => setDeleting(null)} confirm={removeLead} /> : null}
    {subscribing ? <SubscribeLeadModal lead={subscribing} groups={trialGroups} pending={pending} close={() => setSubscribing(null)} submit={subscribeLead} /> : null}
    {losing ? <LostReasonModal lead={losing} pending={pending} close={() => setLosing(null)} submit={markLost} /> : null}
  </div>;
}

function TrialGroupModal({ lead, groups, pending, close, submit }: { lead: MarvelOpsLead; groups: LeadGroup[]; pending: boolean; close: () => void; submit: (groupId: string) => void }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}><form onSubmit={(event) => { event.preventDefault(); submit(groupId); }}><Dialog.Close className={styles.close} aria-label="Close"><X size={17} /></Dialog.Close><span>Trial booking</span><Dialog.Title asChild><h2>Assign {lead.name} to a group</h2></Dialog.Title><Dialog.Description className="sr-only">Choose which trial group to book {lead.name} into.</Dialog.Description><label>Trial group<select value={groupId} onChange={(event) => setGroupId(event.target.value)} required><option value="" disabled>Choose a group</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><footer><Dialog.Close asChild><button type="button">Cancel</button></Dialog.Close><button className={styles.primary} disabled={pending || !groupId}>{pending ? "Saving…" : "Book trial"}</button></footer></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function CreateLeadModal({ pending, close, submit }: { pending: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}><form onSubmit={submit}><Dialog.Close className={styles.close} aria-label="Close"><X size={17} /></Dialog.Close><span>New intake</span><Dialog.Title asChild><h2>Add a lead</h2></Dialog.Title><Dialog.Description className="sr-only">Add a new lead to the intake queue.</Dialog.Description><label>Full name<input name="fullName" required /></label><label>Phone<input name="phone" required /></label><label>Email<input name="email" type="email" /></label><label>Source<select name="source" defaultValue="Other">{adminLeadSources.map((item) => <option key={item}>{item}</option>)}</select></label><label>Interested category<select name="interestedCategory" defaultValue="">{trainingCategoryLabels.map((item) => <option key={item}>{item}</option>)}</select></label><label>Preferred availability<input name="preferredAvailability" placeholder="e.g. Weekday evenings" /></label><label>Note<input name="message" /></label><footer><Dialog.Close asChild><button type="button">Cancel</button></Dialog.Close><button className={styles.primary} disabled={pending}>{pending ? "Adding…" : "Add lead"}</button></footer></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function SubscribeLeadModal({ lead, groups, pending, close, submit }: {
  lead: MarvelOpsLead;
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
  const [groupId, setGroupId] = useState(lead.trialGroupId ?? groups[0]?.id ?? "");
  const [durationMonths, setDurationMonths] = useState<1 | 3>(1);
  const [sessionsPerMonth, setSessionsPerMonth] = useState<(typeof sessionChoices)[number]>(8);
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof adminPaymentMethods)[number]>("Cash");

  return <Dialog.Root open onOpenChange={(open) => !open && !pending && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={`${styles.modal} ${styles.membershipModal}`}>
    <form onSubmit={(event) => { event.preventDefault(); submit({ groupId, durationMonths, sessionsPerMonth, price, paymentMethod }); }}>
      <Dialog.Close className={styles.close} aria-label="Close" disabled={pending}><X size={17} /></Dialog.Close>
      <span>Membership</span>
      <Dialog.Title asChild><h2>Subscribe {lead.name}</h2></Dialog.Title>
      <Dialog.Description className={styles.modalIntro}>Convert {lead.name} into an active member, record the payment, and create the first subscription receipt.</Dialog.Description>
      <label>Amount (EGP)<input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" disabled={pending} required /></label>
      <fieldset className={styles.paymentChoices} disabled={pending}><legend>Duration</legend><div className={styles.choiceChips}>{([{ months: 1, label: "1 month" }, { months: 3, label: "3 months" }] as const).map((duration) => <button key={duration.months} type="button" data-active={durationMonths === duration.months || undefined} aria-pressed={durationMonths === duration.months} onClick={() => setDurationMonths(duration.months)}>{duration.label}</button>)}</div></fieldset>
      <fieldset className={styles.paymentChoices} disabled={pending}><legend>Sessions per month</legend><div className={styles.choiceChips}>{sessionChoices.map((value) => <button key={value} type="button" data-active={sessionsPerMonth === value || undefined} aria-pressed={sessionsPerMonth === value} onClick={() => setSessionsPerMonth(value)}>{value}</button>)}</div></fieldset>
      <fieldset className={styles.paymentChoices} disabled={pending}><legend>Paid with</legend><div className={styles.choiceChips}>{adminPaymentMethods.map((method) => <button key={method} type="button" data-active={paymentMethod === method || undefined} aria-pressed={paymentMethod === method} onClick={() => setPaymentMethod(method)}>{method}</button>)}</div></fieldset>
      <fieldset className={styles.paymentChoices} disabled={pending}><legend>Group</legend><div className={styles.groupChoices}>{groups.map((group) => <button key={group.id} type="button" data-active={groupId === group.id || undefined} aria-pressed={groupId === group.id} onClick={() => setGroupId(group.id)}><span>{group.name}</span>{group.id === lead.trialGroupId ? <small>Trial group</small> : null}</button>)}</div></fieldset>
      <footer><Dialog.Close asChild><button type="button" disabled={pending}>Cancel</button></Dialog.Close><button className={styles.primary} disabled={pending || !groupId || !price.trim()}>{pending ? <><LoaderCircle size={14} className={styles.spinner} /> Saving</> : "Subscribe"}</button></footer>
    </form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function LostReasonModal({ lead, pending, close, submit }: { lead: MarvelOpsLead; pending: boolean; close: () => void; submit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}>
    <form onSubmit={(event) => { event.preventDefault(); submit(reason); }}>
      <Dialog.Close className={styles.close} aria-label="Close"><X size={17} /></Dialog.Close>
      <span>Mark lost</span>
      <Dialog.Title asChild><h2>Mark {lead.name} as lost?</h2></Dialog.Title>
      <Dialog.Description>The lead record is kept for reporting; this closes the pipeline card.</Dialog.Description>
      <label>Reason (optional)<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Chose another gym" /></label>
      <footer><Dialog.Close asChild><button type="button">Cancel</button></Dialog.Close><button className={styles.primary} disabled={pending}>{pending ? "Saving…" : "Mark lost"}</button></footer>
    </form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function DeleteLeadModal({ lead, pending, close, confirm }: { lead: MarvelOpsLead; pending: boolean; close: () => void; confirm: () => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && !pending && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}><Dialog.Close className={styles.close} aria-label="Close" disabled={pending}><X size={17} /></Dialog.Close><span>Remove lead</span><Dialog.Title asChild><h2>Delete {lead.name}?</h2></Dialog.Title><Dialog.Description>This permanently removes the lead from the pipeline.</Dialog.Description><footer><button type="button" onClick={close} disabled={pending}>Cancel</button><button className={styles.primary} type="button" onClick={confirm} disabled={pending}>{pending ? "Deleting…" : "Delete lead"}<Trash2 size={14} /></button></footer></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function LeadDrawer({ lead, close }: { lead: MarvelOpsLead; close: () => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.drawerOverlay} /><Dialog.Content className={styles.drawer} aria-describedby={undefined}><header className={styles.drawerHeader}><Dialog.Close className={styles.close} aria-label="Close lead"><X size={18} /></Dialog.Close><div className={styles.profileIdentity}><i data-tone={lead.tone}>{lead.initials}</i><div><Dialog.Title asChild><h2>{lead.name}</h2></Dialog.Title><p>{lead.stage} · {lead.source}</p></div></div></header><dl className={styles.details}><div><dt>Phone</dt><dd>{lead.phone}</dd></div><div><dt>Interest</dt><dd>{lead.wants}</dd></div>{lead.preferredAvailability ? <div><dt>Availability</dt><dd>{lead.preferredAvailability}</dd></div> : null}<div><dt>Note</dt><dd>{lead.note}</dd></div>{lead.injury ? <div><dt>Restriction</dt><dd>{lead.injury}</dd></div> : null}{lead.lostReason ? <div><dt>Lost reason</dt><dd>{lead.lostReason}</dd></div> : null}</dl></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
