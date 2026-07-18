"use client";

import { useDeferredValue, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import type { AdminCoachRecord, AdminCoachSpecialization } from "@/lib/mocks/admin-coaches";
import { getInitials } from "@/lib/utils";
import styles from "./admin-coaches-command-center.module.css";

type CoachForm = { fullName: string; email: string; phone: string; specialization: AdminCoachSpecialization };
type Sort = "name" | "load" | "open";

const emptyForm: CoachForm = { fullName: "", email: "", phone: "", specialization: "Strength" };
const specialties: Array<"All" | AdminCoachSpecialization> = ["All", "Strength", "Conditioning", "Mobility", "Private Coaching", "Football", "Tennis", "Calisthenics", "Rehab", "Athletic Performance", "General Fitness"];

function coachState(coach: AdminCoachRecord) {
  if (coach.conflicts) return { label: "Conflict", className: styles.danger };
  if (!coach.sessionsThisWeek) return { label: "Unscheduled", className: styles.warning };
  if (coach.openSlots <= 1) return { label: "At capacity", className: styles.dark };
  return { label: "Available", className: styles.success };
}

export function AdminCoachesCommandCenter({ records }: { records: AdminCoachRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [specialty, setSpecialty] = useState<(typeof specialties)[number]>("All");
  const [sort, setSort] = useState<Sort>("name");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [form, setForm] = useState<CoachForm>(emptyForm);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((coach) => (!query || [coach.fullName, coach.email, coach.specialization, coach.summary].join(" ").toLowerCase().includes(query)) && (specialty === "All" || coach.specialization === specialty)).sort((a, b) => {
      if (sort === "load") return b.sessionsThisWeek - a.sessionsThisWeek;
      if (sort === "open") return b.openSlots - a.openSlots;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [deferredSearch, records, sort, specialty]);

  function openCreate() {
    setEditingId(null); setForm(emptyForm); setDeleteMode(false); setConfirmation(""); setError(""); setEditorOpen(true);
  }
  function openEdit(coach: AdminCoachRecord) {
    setEditingId(coach.id); setForm({ fullName: coach.fullName, email: coach.email, phone: coach.phone, specialization: coach.specialization }); setDeleteMode(false); setConfirmation(""); setError(""); setEditorOpen(true);
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    startTransition(async () => {
      try { await saveCoach({ coachId: editingId, ...form }); setEditorOpen(false); router.refresh(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save coach."); }
    });
  }
  function removeCoach() {
    if (!editingId) return;
    setError(""); startTransition(async () => {
      try { await deleteCoach({ coachId: editingId, confirmationText: confirmation }); setEditorOpen(false); router.refresh(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete coach."); }
    });
  }

  return (
    <div className={styles.page} aria-busy={pending}>
      <section className={styles.board}>
        <header className={styles.controls}>
          <label className={styles.search}><Search size={17} /><span className="sr-only">Search coaches</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Coach, specialty or note" /></label>
          <div className={styles.specialties}>{specialties.map((item) => <button type="button" key={item} data-active={specialty === item || undefined} onClick={() => setSpecialty(item)}>{item}</button>)}</div>
          <label className={styles.sort}>Sort<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="name">Name A-Z</option><option value="load">Highest load</option><option value="open">Most capacity</option></select></label>
          <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={17} /> New coach</button>
        </header>

        {visible.length ? <div className={styles.coachGrid}>{visible.map((coach) => { const state=coachState(coach); const load=Math.min(100,Math.round(coach.sessionsThisWeek/12*100)); return <article className={styles.coachCard} key={coach.id}>
          <header><span className={styles.avatar}>{getInitials(coach.fullName)}</span><div><h2>{coach.fullName}</h2><small>{coach.specialization} · {coach.email}</small></div><span className={`${styles.state} ${state.className}`}>{coach.openSlots ? `${coach.openSlots} free slots` : state.label}</span><button type="button" onClick={()=>openEdit(coach)} aria-label={`Edit ${coach.fullName}`}><Pencil size={15}/></button></header>
          <div className={styles.timeline}>{coach.weeklyLoad.map((day)=><span key={day.day}><i data-active={day.sessions>0||undefined} style={{opacity:day.sessions ? Math.min(1,.28+day.sessions*.23) : .15}}/><small>{day.day.slice(0,1)}</small></span>)}</div>
          <footer><div><strong>{coach.sessionsThisWeek}</strong><small>Sessions/wk</small></div><div><strong>{coach.activeClients}</strong><small>Clients</small></div><div className={styles.loadLine}><span>Weekly load <b>{load}%</b></span><i><b style={{width:`${load}%`}}/></i></div></footer>
        </article>})}</div> : <div className={styles.empty}><Search size={24}/><strong>No coaches match</strong><span>Change the search or specialty filter.</span></div>}
      </section>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{editingId ? "Manage coach" : "Add a coach"}</Dialog.Title><Dialog.Description>Maintain the coach account and core training specialty.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close coach editor"><X size={18} /></Dialog.Close>
        {!deleteMode ? <form onSubmit={submit} className={styles.form}><label className={styles.full}>Full name<input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></label><label>Phone<input type="tel" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></label><label className={styles.full}>Specialty<select value={form.specialization} onChange={(event) => setForm((value) => ({ ...value, specialization: event.target.value as AdminCoachSpecialization }))}>{specialties.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>{error ? <p className={`${styles.error} ${styles.full}`} role="alert">{error}</p> : null}<div className={`${styles.formActions} ${styles.full}`}>{editingId ? <button type="button" className={styles.deleteButton} onClick={() => setDeleteMode(true)}><Trash2 size={16} /> Delete</button> : <span />}<button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save coach"}</button></div></form> : <div className={styles.deletePanel}><Trash2 size={25} /><h3>Delete this coach?</h3><p>Assigned groups or sessions must be moved first. Type Delete to confirm.</p><label>Confirmation<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Delete" /></label>{error ? <p className={styles.error} role="alert">{error}</p> : null}<div><button className="mv-btn mv-btn-secondary" onClick={() => setDeleteMode(false)}>Back</button><button className={styles.deleteButton} onClick={removeCoach} disabled={confirmation !== "Delete" || pending}>Delete permanently</button></div></div>}
      </Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
