"use client";

import { AlertTriangle, ChevronRight, LoaderCircle, Plus, X } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { approveLeadAsClient, assignLeadTrial, completeLeadTrial, createAdminLead } from "@/app/actions/admin-leads";
import styles from "./marvel-ops-admin-view.module.css";

type View = "leads";
const stages = ["New", "Trial booked", "Trial done", "Won", "Lost"] as const;
type Stage = (typeof stages)[number];
export type MarvelOpsLead = { id: string; stage: Stage; name: string; initials: string; tone: string; source: "WhatsApp" | "Instagram" | "Call" | "On-ground"; phone: string; wants: string; note: string; injury?: string; assigned?: string };
const actions: Record<Stage, string> = { New: "Assign to group", "Trial booked": "Mark trial done", "Trial done": "Subscribe", Won: "", Lost: "" };
type LeadGroup = { id: string; name: string };

export function MarvelOpsAdminView({ initialLeads = [], trialGroups = [] }: { view: View; initialLeads?: MarvelOpsLead[]; trialGroups?: LeadGroup[] }) {
  return <LeadsWorkspace records={initialLeads} trialGroups={trialGroups} />;
}

function LeadsWorkspace({ records, trialGroups }: { records: MarvelOpsLead[]; trialGroups: LeadGroup[] }) {
  const [source, setSource] = useState<MarvelOpsLead["source"] | "All">("All");
  const [selected, setSelected] = useState<MarvelOpsLead | null>(null);
  const [leadForGroup, setLeadForGroup] = useState<MarvelOpsLead | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const shown = source === "All" ? records : records.filter((lead) => lead.source === source);

  function progressLead(lead: MarvelOpsLead) {
    setNotice("");
    if (lead.stage === "New") { setLeadForGroup(lead); return; }
    startTransition(async () => {
      try {
        if (lead.stage === "Trial booked") {
          await completeLeadTrial(lead.id);
          setNotice(`${lead.name}'s trial is marked complete.`);
        } else if (lead.stage === "Trial done") {
          const summary = await approveLeadAsClient(lead.id);
          const result = summary.results[0];
          if (result?.outcome !== "promoted") throw new Error(result?.details ?? "Could not create the client.");
          setNotice(`${result.details} Client ID: ${result.clientId}. Temporary password: ${result.temporaryPassword}.`);
        }
      } catch (caught) { setNotice(caught instanceof Error ? caught.message : "The lead could not be updated."); }
    });
  }

  function assignGroup(groupId: string) {
    if (!leadForGroup) return;
    startTransition(async () => {
      try { await assignLeadTrial({ leadId: leadForGroup.id, groupId }); setNotice(`${leadForGroup.name} is booked for a trial.`); setLeadForGroup(null); }
      catch (caught) { setNotice(caught instanceof Error ? caught.message : "The trial could not be booked."); }
    });
  }

  function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setNotice("");
    startTransition(async () => {
      try { await createAdminLead({ fullName: String(values.get("fullName") ?? ""), phone: String(values.get("phone") ?? ""), email: String(values.get("email") ?? ""), source: String(values.get("source") ?? "Admin"), message: String(values.get("message") ?? "") }); setCreating(false); setNotice("Lead added to the New column."); }
      catch (caught) { setNotice(caught instanceof Error ? caught.message : "The lead could not be added."); }
    });
  }

  return <div className={styles.page} aria-busy={pending}>
    <div className={styles.sources}>{(["All", "WhatsApp", "Instagram", "Call", "On-ground"] as const).map((item) => <button key={item} type="button" data-active={source === item || undefined} onClick={() => setSource(item)}>{item}<b>{item === "All" ? records.length : records.filter((lead) => lead.source === item).length}</b></button>)}<button type="button" onClick={() => setCreating(true)}><Plus size={16} /> Add lead</button></div>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    <section className={styles.kanban}>{stages.map((stage) => <div className={styles.lane} key={stage}><header><strong>{stage}</strong><small>{shown.filter((lead) => lead.stage === stage).length}</small></header>{shown.filter((lead) => lead.stage === stage).map((lead) => <article key={lead.id} role="button" tabIndex={0} onClick={() => setSelected(lead)} onKeyDown={(event) => { if (event.key === "Enter") setSelected(lead); }}><div className={styles.leadName}><i data-tone={lead.tone}>{lead.initials}</i><span><strong>{lead.name}</strong><small>{lead.note}</small></span></div><em data-source={lead.source}>{lead.source}</em><p><small>Wants</small><b>{lead.wants}</b></p>{lead.injury ? <p className={styles.leadInjury}><AlertTriangle size={11} /> {lead.injury}</p> : null}{lead.assigned ? <p className={styles.assigned}>{lead.assigned}</p> : null}<p className={styles.phone}>{lead.phone}</p>{actions[stage] ? <button type="button" disabled={pending} onClick={(event) => { event.stopPropagation(); progressLead(lead); }}>{pending ? <LoaderCircle size={14} /> : <>{actions[stage]}<ChevronRight size={14} /></>}</button> : null}</article>)}</div>)}</section>
    {selected ? <LeadDrawer lead={selected} close={() => setSelected(null)} /> : null}
    {leadForGroup ? <TrialGroupModal lead={leadForGroup} groups={trialGroups} pending={pending} close={() => setLeadForGroup(null)} submit={assignGroup} /> : null}
    {creating ? <CreateLeadModal pending={pending} close={() => setCreating(false)} submit={addLead} /> : null}
  </div>;
}

function TrialGroupModal({ lead, groups, pending, close, submit }: { lead: MarvelOpsLead; groups: LeadGroup[]; pending: boolean; close: () => void; submit: (groupId: string) => void }) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  return <div className={styles.overlay} onClick={close}><form className={styles.modal} onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); submit(groupId); }}><button type="button" className={styles.close} onClick={close} aria-label="Close"><X size={17} /></button><span>Trial booking</span><h2>Assign {lead.name} to a group</h2><label>Trial group<select value={groupId} onChange={(event) => setGroupId(event.target.value)} required><option value="" disabled>Choose a group</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><footer><button type="button" onClick={close}>Cancel</button><button className={styles.primary} disabled={pending || !groupId}>{pending ? "Saving…" : "Book trial"}</button></footer></form></div>;
}

function CreateLeadModal({ pending, close, submit }: { pending: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className={styles.overlay} onClick={close}><form className={styles.modal} onClick={(event) => event.stopPropagation()} onSubmit={submit}><button type="button" className={styles.close} onClick={close} aria-label="Close"><X size={17} /></button><span>New intake</span><h2>Add a lead</h2><label>Full name<input name="fullName" required /></label><label>Phone<input name="phone" required /></label><label>Email<input name="email" type="email" /></label><label>Source<select name="source" defaultValue="Admin"><option>Admin</option><option>WhatsApp</option><option>Instagram</option><option>Call</option><option>On-ground</option></select></label><label>Note<input name="message" /></label><footer><button type="button" onClick={close}>Cancel</button><button className={styles.primary} disabled={pending}>{pending ? "Adding…" : "Add lead"}</button></footer></form></div>;
}

function LeadDrawer({ lead, close }: { lead: MarvelOpsLead; close: () => void }) {
  return <div className={styles.drawerOverlay} onClick={close}><aside className={styles.drawer} onClick={(event) => event.stopPropagation()}><header className={styles.drawerHeader}><button className={styles.close} type="button" onClick={close} aria-label="Close lead"><X size={18} /></button><div className={styles.profileIdentity}><i data-tone={lead.tone}>{lead.initials}</i><div><h2>{lead.name}</h2><p>{lead.stage} · {lead.source}</p></div></div></header><dl className={styles.details}><div><dt>Phone</dt><dd>{lead.phone}</dd></div><div><dt>Interest</dt><dd>{lead.wants}</dd></div><div><dt>Note</dt><dd>{lead.note}</dd></div>{lead.injury ? <div><dt>Restriction</dt><dd>{lead.injury}</dd></div> : null}</dl></aside></div>;
}
