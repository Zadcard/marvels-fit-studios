"use client";

import { useDeferredValue, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { AlertTriangle, CalendarDays, ChevronRight, Mail, Pencil, Phone, Plus, Search, ShieldCheck, Trash2, Users, X } from "lucide-react";

import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import type { AdminCoachRecord, AdminCoachSpecialization } from "@/lib/mocks/admin-coaches";
import { getInitials } from "@/lib/utils";
import styles from "./admin-coaches-command-center.module.css";

type CoachForm = { fullName: string; email: string; phone: string; specialization: AdminCoachSpecialization };
type Sort = "name" | "load" | "open";

const emptyForm: CoachForm = { fullName: "", email: "", phone: "", specialization: "Strength" };
const specialties: Array<"All" | AdminCoachSpecialization> = ["All", "Strength", "Conditioning", "Mobility", "Private Coaching"];

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
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");
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

  const selected = visible.find((coach) => coach.id === selectedId) ?? visible[0] ?? null;
  const sessions = visible.reduce((sum, coach) => sum + coach.sessionsThisWeek, 0);
  const clients = visible.reduce((sum, coach) => sum + coach.activeClients, 0);
  const alerts = visible.filter((coach) => coach.conflicts || !coach.sessionsThisWeek).length;

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
      <header className={styles.hero}>
        <div><span className={styles.kicker}><ShieldCheck size={15} /> Coaching operations</span><h1>Deploy the team.</h1><p>Balance weekly delivery, client responsibility and open capacity before the floor gets busy.</p></div>
        <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={17} /> New coach</button>
      </header>

      <section className={styles.scoreboard} aria-label="Coach operations summary">
        <article><span>Coaches online</span><strong>{visible.length}</strong><small>{clients} active client relationships</small></article>
        <article><span>Weekly blocks</span><strong>{sessions}</strong><small>Assigned sessions in the next 7 days</small></article>
        <article data-alert={alerts > 0 || undefined}><span>Coverage alerts</span><strong>{alerts}</strong><small>{alerts ? "Conflicts or empty calendars" : "No deployment gaps"}</small></article>
        <article className={styles.blackCard}><span>Open capacity</span><strong>{visible.reduce((sum, coach) => sum + coach.openSlots, 0)}</strong><small>Available weekly session slots</small></article>
      </section>

      <section className={styles.board}>
        <div className={styles.controls}>
          <label className={styles.search}><Search size={17} /><span className="sr-only">Search coaches</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Coach, specialty or note" /></label>
          <div className={styles.specialties}>{specialties.map((item) => <button type="button" key={item} data-active={specialty === item || undefined} onClick={() => setSpecialty(item)}>{item}</button>)}</div>
          <label className={styles.sort}>Sort<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="name">Name A-Z</option><option value="load">Highest load</option><option value="open">Most capacity</option></select></label>
        </div>

        <div className={styles.boardGrid}>
          <section className={styles.roster} aria-label="Coach roster">
            <div className={styles.sectionTitle}><div><span>Team roster</span><h2>{visible.length} coaches</h2></div><small>Select to inspect</small></div>
            {visible.length ? <div className={styles.rosterList}>{visible.map((coach) => { const state = coachState(coach); return <button type="button" key={coach.id} data-selected={selected?.id === coach.id || undefined} onClick={() => setSelectedId(coach.id)}><span className={styles.avatar}>{getInitials(coach.fullName)}</span><span className={styles.identity}><strong>{coach.fullName}</strong><small>{coach.specialization}</small></span><span className={`${styles.state} ${state.className}`}>{state.label}</span><span className={styles.metrics}><b>{coach.sessionsThisWeek}</b> sessions <b>{coach.openSlots}</b> open</span><ChevronRight size={17} /></button>; })}</div> : <div className={styles.empty}><Search size={24} /><strong>No coaches match</strong><span>Change the search or specialty filter.</span></div>}
          </section>

          <aside className={styles.focus}>
            {selected ? <>
              <div className={styles.focusTop}><span className={styles.focusAvatar}>{getInitials(selected.fullName)}</span><div><small>{selected.specialization}</small><h2>{selected.fullName}</h2><p>{selected.summary}</p></div><button type="button" aria-label={`Edit ${selected.fullName}`} onClick={() => openEdit(selected)}><Pencil size={17} /></button></div>
              <div className={styles.contact}><a href={`mailto:${selected.email}`}><Mail size={15} /> {selected.email}</a><a href={`tel:${selected.phone}`}><Phone size={15} /> {selected.phone}</a></div>
              <div className={styles.focusNumbers}><article><span>Clients</span><strong>{selected.activeClients}</strong></article><article><span>Sessions</span><strong>{selected.sessionsThisWeek}</strong></article><article><span>Open</span><strong>{selected.openSlots}</strong></article><article><span>Conflicts</span><strong>{selected.conflicts}</strong></article></div>
              <section className={styles.load}><div><CalendarDays size={17} /><span><strong>7-day deployment</strong><small>Scheduled blocks by day</small></span></div><div className={styles.loadBars}>{selected.weeklyLoad.map((day) => <span key={day.day}><i style={{ height: `${Math.max(8, Math.min(100, day.sessions * 28))}%` }} /><b>{day.sessions}</b><small>{day.day.slice(0, 1)}</small></span>)}</div></section>
              {selected.conflicts ? <div className={styles.alert}><AlertTriangle size={17} /><span><strong>Schedule conflict detected</strong><small>Resolve overlapping blocks before publishing.</small></span></div> : null}
              <div className={styles.focusActions}><a className="mv-btn mv-btn-secondary" href="/admin/schedule">View schedule</a><button className="mv-btn mv-btn-primary" type="button" onClick={() => openEdit(selected)}>Manage coach</button></div>
            </> : <div className={styles.empty}><Users size={26} /><strong>No coach selected</strong></div>}
          </aside>
        </div>
      </section>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{editingId ? "Manage coach" : "Add a coach"}</Dialog.Title><Dialog.Description>Maintain the coach account and core training specialty.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close coach editor"><X size={18} /></Dialog.Close>
        {!deleteMode ? <form onSubmit={submit} className={styles.form}><label className={styles.full}>Full name<input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></label><label>Phone<input type="tel" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></label><label className={styles.full}>Specialty<select value={form.specialization} onChange={(event) => setForm((value) => ({ ...value, specialization: event.target.value as AdminCoachSpecialization }))}>{specialties.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>{error ? <p className={`${styles.error} ${styles.full}`} role="alert">{error}</p> : null}<div className={`${styles.formActions} ${styles.full}`}>{editingId ? <button type="button" className={styles.deleteButton} onClick={() => setDeleteMode(true)}><Trash2 size={16} /> Delete</button> : <span />}<button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save coach"}</button></div></form> : <div className={styles.deletePanel}><Trash2 size={25} /><h3>Delete this coach?</h3><p>Assigned groups or sessions must be moved first. Type Delete to confirm.</p><label>Confirmation<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Delete" /></label>{error ? <p className={styles.error} role="alert">{error}</p> : null}<div><button className="mv-btn mv-btn-secondary" onClick={() => setDeleteMode(false)}>Back</button><button className={styles.deleteButton} onClick={removeCoach} disabled={confirmation !== "Delete" || pending}>Delete permanently</button></div></div>}
      </Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
