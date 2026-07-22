"use client";

import { MessageCircle, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";

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
import type { TrainingCategoryOption } from "@/lib/dashboard/training-category";
import { adminPaymentMethods } from "@/lib/mocks/admin-subscriptions";
import { formatPhoneNumber } from "@/lib/phone-format";
import { AdminLeadsTableView } from "./admin-leads-table-view";
import { useDashboardToast } from "./dashboard-toast-provider";
import { EntityDialog, EntityForm, FormActions, FormField } from "@/components/ui/entity-form";
import styles from "./marvel-ops-admin-view.module.css";

type View = "leads";
type Stage = "New" | "Trial booked" | "Trial done" | "Won" | "Lost";
export type MarvelOpsLead = {
  id: string;
  stage: Stage;
  name: string;
  initials: string;
  tone: string;
  source: AdminLeadSource;
  phone: string;
  wants: string;
  categoryId?: string;
  note: string;
  injury?: string;
  assigned?: string;
  trialGroupId?: string;
  preferredAvailability?: string;
  lostReason?: string;
};
const sessionChoices = [8, 12, 16, 20] as const;
type LeadGroup = { id: string; name: string; categoryId: string; scheduleSummary?: string };

export function MarvelOpsAdminView({ initialLeads = [], trialGroups = [], categoryOptions = [] }: { view: View; initialLeads?: MarvelOpsLead[]; trialGroups?: LeadGroup[]; categoryOptions?: TrainingCategoryOption[] }) {
  return <LeadsWorkspace records={initialLeads} trialGroups={trialGroups} categoryOptions={categoryOptions} />;
}

function LeadsWorkspace({ records, trialGroups, categoryOptions }: { records: MarvelOpsLead[]; trialGroups: LeadGroup[]; categoryOptions: TrainingCategoryOption[] }) {
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
          categoryId: String(values.get("categoryId") ?? ""),
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
    {creating ? <CreateLeadModal categories={categoryOptions} pending={pending} close={() => setCreating(false)} submit={addLead} /> : null}
    {deleting ? <DeleteLeadModal lead={deleting} pending={pending} close={() => setDeleting(null)} confirm={removeLead} /> : null}
    {subscribing ? <SubscribeLeadModal lead={subscribing} groups={trialGroups} categories={categoryOptions} pending={pending} close={() => setSubscribing(null)} submit={subscribeLead} /> : null}
    {losing ? <LostReasonModal lead={losing} pending={pending} close={() => setLosing(null)} submit={markLost} /> : null}
  </div>;
}

function TrialGroupModal({ lead, groups, pending, close, submit }: { lead: MarvelOpsLead; groups: LeadGroup[]; pending: boolean; close: () => void; submit: (groupId: string) => void }) {
  const availableGroups = groups.filter((group) => !lead.categoryId || group.categoryId === lead.categoryId);
  const [groupId, setGroupId] = useState(availableGroups[0]?.id ?? "");
  return <EntityDialog open onOpenChange={(open) => !open && close()} title={`Assign ${lead.name} to a group`} description="Only active groups in the lead's interested category are available." closeLabel="Close trial booking" size="small"><EntityForm onSubmit={(event) => { event.preventDefault(); submit(groupId); }}><FormField label="Trial group" full><select value={groupId} onChange={(event) => setGroupId(event.target.value)} required><option value="" disabled>{availableGroups.length ? "Choose a group" : "No active groups in this category"}</option>{availableGroups.map((group) => <option value={group.id} key={group.id}>{group.name}{group.scheduleSummary ? ` (${group.scheduleSummary})` : ""}</option>)}</select></FormField><FormActions onCancel={close} submitLabel="Book trial" pendingLabel="Saving…" pending={pending} disabled={!groupId} /></EntityForm></EntityDialog>;
}


const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function CreateLeadModal({ categories, pending, close, submit }: { categories: TrainingCategoryOption[]; pending: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  function toggleDay(day: string) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    );
  }

  return (
    <EntityDialog open onOpenChange={(open) => !open && close()} title="Add a lead" description="Create an intake record using the studio's active programs." closeLabel="Close lead form">
      <EntityForm onSubmit={submit}>
        <FormField label="Full name" required full>
          <input name="fullName" required />
        </FormField>
        <FormField label="Phone" required>
          <input name="phone" type="tel" placeholder="+20 100 000 0000" required />
        </FormField>
        <FormField label="Source">
          <select name="source" defaultValue="Other">
            {adminLeadSources.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>
        <FormField label="Interested category" required>
          <select name="categoryId" defaultValue={categories[0]?.id ?? ""} required>
            <option value="" disabled>Choose a category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </FormField>
        <FormField label="Preferred availability" full>
          <input type="hidden" name="preferredAvailability" value={selectedDays.join(", ")} />
          <div className={styles.daysGrid}>
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  data-active={active || undefined}
                  className={styles.dayChip}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </FormField>
        <FormField label="Note" full>
          <input name="message" />
        </FormField>
        <FormActions onCancel={close} submitLabel="Add lead" pendingLabel="Adding…" pending={pending} />
      </EntityForm>
    </EntityDialog>
  );
}



function SubscribeLeadModal({ lead, groups, categories = [], pending, close, submit }: {
  lead: MarvelOpsLead;
  groups: LeadGroup[];
  categories?: TrainingCategoryOption[];
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
  const [selectedCatId, setSelectedCatId] = useState<string>(lead.categoryId || "");
  const availableGroups = useMemo(() => {
    return selectedCatId
      ? groups.filter((g) => g.categoryId === selectedCatId)
      : groups;
  }, [groups, selectedCatId]);

  const [groupId, setGroupId] = useState<string>(() => {
    if (lead.trialGroupId && groups.some((g) => g.id === lead.trialGroupId)) {
      return lead.trialGroupId;
    }
    return availableGroups[0]?.id ?? "";
  });

  const [durationMonths, setDurationMonths] = useState<1 | 3>(1);
  const [sessionsPerMonth, setSessionsPerMonth] = useState<(typeof sessionChoices)[number]>(8);
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof adminPaymentMethods)[number]>("Cash");

  function handleCategoryChange(catId: string) {
    setSelectedCatId(catId);
    const catGroups = catId ? groups.filter((g) => g.categoryId === catId) : groups;
    if (catGroups.length > 0 && !catGroups.some((g) => g.id === groupId)) {
      setGroupId(catGroups[0].id);
    }
  }

  return (
    <EntityDialog open onOpenChange={(open) => !open && !pending && close()} title={`Subscribe ${lead.name}`} description={`Convert ${lead.name} into an active member, record the payment, and create the first subscription receipt.`} closeLabel="Close subscription form">
      <EntityForm onSubmit={(event) => { event.preventDefault(); submit({ groupId, durationMonths, sessionsPerMonth, price, paymentMethod }); }}>
        <FormField label="Amount (EGP)" full>
          <input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" disabled={pending} required />
        </FormField>

        {categories.length > 0 && (
          <FormField label="Category" full>
            <select
              value={selectedCatId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={pending}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <fieldset className={styles.paymentChoices} disabled={pending}>
          <legend>Duration</legend>
          <div className={styles.choiceChips}>
            {([{ months: 1, label: "1 month" }, { months: 3, label: "3 months" }] as const).map((duration) => (
              <button key={duration.months} type="button" data-active={durationMonths === duration.months || undefined} aria-pressed={durationMonths === duration.months} onClick={() => setDurationMonths(duration.months)}>
                {duration.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.paymentChoices} disabled={pending}>
          <legend>Sessions per month</legend>
          <div className={styles.choiceChips}>
            {sessionChoices.map((value) => (
              <button key={value} type="button" data-active={sessionsPerMonth === value || undefined} aria-pressed={sessionsPerMonth === value} onClick={() => setSessionsPerMonth(value)}>
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.paymentChoices} disabled={pending}>
          <legend>Paid with</legend>
          <div className={styles.choiceChips}>
            {adminPaymentMethods.map((method) => (
              <button key={method} type="button" data-active={paymentMethod === method || undefined} aria-pressed={paymentMethod === method} onClick={() => setPaymentMethod(method)}>
                {method}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.paymentChoices} disabled={pending}>
          <legend>Group (Default: Trial Group)</legend>
          <div className={styles.groupChoices}>
            {availableGroups.length === 0 ? (
              <p style={{ color: "#8f8f8f", fontSize: "0.75rem", margin: "4px 0" }}>
                No active groups available in this category.
              </p>
            ) : (
              availableGroups.map((group: LeadGroup) => (
                <button
                  key={group.id}
                  type="button"
                  data-active={groupId === group.id || undefined}
                  aria-pressed={groupId === group.id}
                  onClick={() => setGroupId(group.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>{group.name}</span>
                    {group.id === lead.trialGroupId && (
                      <span style={{
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: "rgba(37, 211, 102, 0.14)",
                        border: "1px solid rgba(37, 211, 102, 0.35)",
                        color: "#25d366",
                        fontSize: "0.52rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        flexShrink: 0
                      }}>Trial Group</span>
                    )}
                  </div>
                  {group.scheduleSummary && (
                    <small style={{ color: "#a8a8a8", fontSize: "0.58rem", marginTop: 3, display: "block" }}>
                      📅 {group.scheduleSummary}
                    </small>
                  )}
                </button>
              ))

            )}
          </div>
        </fieldset>

        <FormActions onCancel={close} submitLabel="Subscribe" pendingLabel="Saving…" pending={pending} disabled={!groupId || !price.trim()} />
      </EntityForm>
    </EntityDialog>
  );
}


function LostReasonModal({ lead, pending, close, submit }: { lead: MarvelOpsLead; pending: boolean; close: () => void; submit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return <EntityDialog open onOpenChange={(open) => !open && close()} title={`Mark ${lead.name} as lost?`} description="The lead record is kept for reporting; this closes the pipeline card." closeLabel="Close lost lead form" size="small"><EntityForm onSubmit={(event) => { event.preventDefault(); submit(reason); }}><FormField label="Reason (optional)" full><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Chose another gym" /></FormField><FormActions onCancel={close} submitLabel="Mark lost" pendingLabel="Saving…" pending={pending} /></EntityForm></EntityDialog>;
}

function DeleteLeadModal({ lead, pending, close, confirm }: { lead: MarvelOpsLead; pending: boolean; close: () => void; confirm: () => void }) {
  return <EntityDialog open onOpenChange={(open) => !open && !pending && close()} title={`Delete ${lead.name}?`} description="This permanently removes the lead from the pipeline." closeLabel="Close delete lead confirmation" size="small"><div className={styles.deleteConfirmActions}><button type="button" className="mv-btn mv-btn-secondary" onClick={close} disabled={pending}>Cancel</button><button className="mv-btn mv-btn-primary" type="button" onClick={confirm} disabled={pending}>{pending ? "Deleting…" : "Delete lead"}<Trash2 size={14} /></button></div></EntityDialog>;
}

function LeadDrawer({ lead, close }: { lead: MarvelOpsLead; close: () => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.drawerOverlay} /><Dialog.Content className={styles.drawer} aria-describedby={undefined}><header className={styles.drawerHeader}><Dialog.Close className={styles.close} aria-label="Close lead"><X size={18} /></Dialog.Close><div className={styles.profileIdentity}><i data-tone={lead.tone}>{lead.initials}</i><div><Dialog.Title asChild><h2>{lead.name}</h2></Dialog.Title><p>{lead.stage} · {lead.source}</p></div></div></header><dl className={styles.details}><div><dt>Phone</dt><dd style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{formatPhoneNumber(lead.phone)}{lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 6, background: "rgba(37, 211, 102, 0.14)", border: "1px solid rgba(37, 211, 102, 0.3)", color: "#25d366", textDecoration: "none", fontSize: ".68rem" }} title="Send WhatsApp message"><MessageCircle size={13} /></a>}</dd></div><div><dt>Interest</dt><dd>{lead.wants}</dd></div>{lead.preferredAvailability ? <div><dt>Availability</dt><dd>{lead.preferredAvailability}</dd></div> : null}<div><dt>Note</dt><dd>{lead.note}</dd></div>{lead.injury ? <div><dt>Restriction</dt><dd>{lead.injury}</dd></div> : null}{lead.lostReason ? <div><dt>Lost reason</dt><dd>{lead.lostReason}</dd></div> : null}</dl></Dialog.Content></Dialog.Portal></Dialog.Root>;
}


