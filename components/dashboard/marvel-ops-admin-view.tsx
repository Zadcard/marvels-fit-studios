"use client";

import { AlertTriangle, ChevronRight, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";

import { approveLeadAsClient, assignLeadTrial, completeLeadTrial, createAdminLead, deleteLead } from "@/app/actions/admin-leads";
import type { AdminLeadSource } from "@/lib/dashboard/lead-source";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./marvel-ops-admin-view.module.css";

type View = "leads";
const stages = ["New", "Trial booked", "Trial done", "Won", "Lost"] as const;
type Stage = (typeof stages)[number];
export type MarvelOpsLead = { id: string; stage: Stage; name: string; initials: string; tone: string; source: AdminLeadSource; phone: string; wants: string; note: string; injury?: string; assigned?: string };
const actions: Record<Stage, string> = { New: "Assign to group", "Trial booked": "Mark trial done", "Trial done": "Subscribe", Won: "", Lost: "" };
type LeadGroup = { id: string; name: string };

export function MarvelOpsAdminView({ initialLeads = [], trialGroups = [] }: { view: View; initialLeads?: MarvelOpsLead[]; trialGroups?: LeadGroup[] }) {
  return <LeadsWorkspace records={initialLeads} trialGroups={trialGroups} />;
}

function LeadsWorkspace({ records, trialGroups }: { records: MarvelOpsLead[]; trialGroups: LeadGroup[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useDashboardToast();
  const [source, setSource] = useState<MarvelOpsLead["source"] | "All">("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MarvelOpsLead | null>(null);
  const [leadForGroup, setLeadForGroup] = useState<MarvelOpsLead | null>(null);
  const [deleting, setDeleting] = useState<MarvelOpsLead | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const term = search.trim().toLowerCase();
  const shown = records.filter(
    (lead) =>
      (source === "All" || lead.source === source) &&
      (!term || [lead.name, lead.phone, lead.note].join(" ").toLowerCase().includes(term)),
  );

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
    startTransition(async () => {
      try {
        if (lead.stage === "Trial booked") {
          await completeLeadTrial(lead.id);
          const success = `${lead.name}'s trial is marked complete.`;
          setNotice(success);
          showToast(success);
          router.refresh();
        } else if (lead.stage === "Trial done") {
          const summary = await approveLeadAsClient(lead.id);
          const result = summary.results[0];
          if (result?.outcome !== "promoted") throw new Error(result?.details ?? "Could not create the client.");
          const success = result.details;
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
      try { await createAdminLead({ fullName: String(values.get("fullName") ?? ""), phone: String(values.get("phone") ?? ""), email: String(values.get("email") ?? ""), source: String(values.get("source") ?? "Admin"), message: String(values.get("message") ?? "") }); setCreating(false); setNotice("Lead added to the New column."); showToast("Lead added to the New column."); router.refresh(); }
      catch (caught) { const description = caught instanceof Error ? caught.message : "The lead could not be added."; setNotice(description); showToast(description, "warning"); }
    });
  }

  return <div className={styles.page} aria-busy={pending}>
    <div className={styles.leadsToolbar}>
      <label className={styles.leadsSearch}><Search size={16} /><span className="sr-only">Search leads</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, phone, or note" /></label>
      <div className={styles.sources}>{(["All", "Admin", "WhatsApp", "Instagram", "Call", "On-ground", "Other"] as const).map((item) => <button key={item} type="button" data-active={source === item || undefined} onClick={() => setSource(item)}>{item}<b>{item === "All" ? records.length : records.filter((lead) => lead.source === item).length}</b></button>)}<button type="button" onClick={() => setCreating(true)}><Plus size={16} /> Add lead</button></div>
    </div>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    <section className={styles.kanban}>{stages.map((stage) => <div className={styles.lane} data-stage={stage} key={stage}><header><strong>{stage}</strong><small>{shown.filter((lead) => lead.stage === stage).length}</small></header>{shown.filter((lead) => lead.stage === stage).map((lead) => <article key={lead.id} role="button" tabIndex={0} onClick={() => setSelected(lead)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(lead); } }}><div className={styles.leadName}><i data-tone={lead.tone}>{lead.initials}</i><span><strong>{lead.name}</strong><small>{lead.note}</small></span><button type="button" className={styles.deleteLead} aria-label={`Delete ${lead.name}`} onClick={(event) => { event.stopPropagation(); setDeleting(lead); }}><X size={13} /></button></div><em data-source={lead.source}>{lead.source}</em><p><small>Wants</small><b className={styles.wantsChip}>{lead.wants}</b></p>{lead.injury ? <p className={styles.leadInjury}><AlertTriangle size={11} /> {lead.injury}</p> : null}{lead.assigned ? <p className={styles.assigned}>{lead.assigned}</p> : null}<p className={styles.phone}>{lead.phone}</p>{actions[stage] ? <button type="button" disabled={pending} onClick={(event) => { event.stopPropagation(); progressLead(lead); }}>{pending ? <LoaderCircle size={14} /> : <>{actions[stage]}<ChevronRight size={14} /></>}</button> : null}</article>)}{!shown.filter((lead) => lead.stage === stage).length ? <p className={styles.laneEmpty}>No leads</p> : null}</div>)}</section>
    {selected ? <LeadDrawer lead={selected} close={() => setSelected(null)} /> : null}
    {leadForGroup ? <TrialGroupModal lead={leadForGroup} groups={trialGroups} pending={pending} close={() => setLeadForGroup(null)} submit={assignGroup} /> : null}
    {creating ? <CreateLeadModal pending={pending} close={() => setCreating(false)} submit={addLead} /> : null}
    {deleting ? <DeleteLeadModal lead={deleting} pending={pending} close={() => setDeleting(null)} confirm={removeLead} /> : null}
  </div>;
}

function TrialGroupModal({ lead, groups, pending, close, submit }: { lead: MarvelOpsLead; groups: LeadGroup[]; pending: boolean; close: () => void; submit: (groupId: string) => void }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}><form onSubmit={(event) => { event.preventDefault(); submit(groupId); }}><Dialog.Close className={styles.close} aria-label="Close"><X size={17} /></Dialog.Close><span>Trial booking</span><Dialog.Title asChild><h2>Assign {lead.name} to a group</h2></Dialog.Title><Dialog.Description className="sr-only">Choose which trial group to book {lead.name} into.</Dialog.Description><label>Trial group<select value={groupId} onChange={(event) => setGroupId(event.target.value)} required><option value="" disabled>Choose a group</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><footer><Dialog.Close asChild><button type="button">Cancel</button></Dialog.Close><button className={styles.primary} disabled={pending || !groupId}>{pending ? "Saving…" : "Book trial"}</button></footer></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function CreateLeadModal({ pending, close, submit }: { pending: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}><form onSubmit={submit}><Dialog.Close className={styles.close} aria-label="Close"><X size={17} /></Dialog.Close><span>New intake</span><Dialog.Title asChild><h2>Add a lead</h2></Dialog.Title><Dialog.Description className="sr-only">Add a new lead to the intake queue.</Dialog.Description><label>Full name<input name="fullName" required /></label><label>Phone<input name="phone" required /></label><label>Email<input name="email" type="email" /></label><label>Source<select name="source" defaultValue="Admin"><option>Admin</option><option>WhatsApp</option><option>Instagram</option><option>Call</option><option>On-ground</option></select></label><label>Note<input name="message" /></label><footer><Dialog.Close asChild><button type="button">Cancel</button></Dialog.Close><button className={styles.primary} disabled={pending}>{pending ? "Adding…" : "Add lead"}</button></footer></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function DeleteLeadModal({ lead, pending, close, confirm }: { lead: MarvelOpsLead; pending: boolean; close: () => void; confirm: () => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && !pending && close()}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.modal}><Dialog.Close className={styles.close} aria-label="Close" disabled={pending}><X size={17} /></Dialog.Close><span>Remove lead</span><Dialog.Title asChild><h2>Delete {lead.name}?</h2></Dialog.Title><Dialog.Description>This permanently removes the lead from the pipeline.</Dialog.Description><footer><button type="button" onClick={close} disabled={pending}>Cancel</button><button className={styles.primary} type="button" onClick={confirm} disabled={pending}>{pending ? "Deleting…" : "Delete lead"}<Trash2 size={14} /></button></footer></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function LeadDrawer({ lead, close }: { lead: MarvelOpsLead; close: () => void }) {
  return <Dialog.Root open onOpenChange={(open) => !open && close()}><Dialog.Portal><Dialog.Overlay className={styles.drawerOverlay} /><Dialog.Content className={styles.drawer} aria-describedby={undefined}><header className={styles.drawerHeader}><Dialog.Close className={styles.close} aria-label="Close lead"><X size={18} /></Dialog.Close><div className={styles.profileIdentity}><i data-tone={lead.tone}>{lead.initials}</i><div><Dialog.Title asChild><h2>{lead.name}</h2></Dialog.Title><p>{lead.stage} · {lead.source}</p></div></div></header><dl className={styles.details}><div><dt>Phone</dt><dd>{lead.phone}</dd></div><div><dt>Interest</dt><dd>{lead.wants}</dd></div><div><dt>Note</dt><dd>{lead.note}</dd></div>{lead.injury ? <div><dt>Restriction</dt><dd>{lead.injury}</dd></div> : null}</dl></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
