"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { KeyRound, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";

import { issueAccountPasswordResetLink } from "@/app/actions/account-security";
import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import type { AdminCoachRecord, AdminCoachSpecialization } from "@/lib/mocks/admin-coaches";
import { getInitials } from "@/lib/utils";
import {
  TemporaryCredentialsDialog,
  type TemporaryCredentials,
} from "./temporary-credentials-dialog";
import {
  PasswordResetLinkDialog,
  type PasswordResetLink,
} from "./password-reset-link-dialog";
import { useDashboardToast } from "./dashboard-toast-provider";
import styles from "./admin-coaches-command-center.module.css";

type CoachForm = { fullName: string; email: string; phone: string; specialization: AdminCoachSpecialization };

const emptyForm: CoachForm = { fullName: "", email: "", phone: "", specialization: "Strength" };
const specialties: Array<"All" | AdminCoachSpecialization> = ["All", "Strength", "Conditioning", "Mobility", "Private Coaching", "Football", "Tennis", "Calisthenics", "Rehab", "Athletic Performance", "General Fitness"];

const SLOT_LABELS = ["7a", "9a", "11a", "1p", "3p", "5p", "7p"];
const AVATAR_TONES = [
  "linear-gradient(135deg,#e62429,#ff656a)",
  "linear-gradient(135deg,#3b82f6,#8b5cf6)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#f59e0b,#ff6b35)",
  "linear-gradient(135deg,#25d366,#14b8a6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
];

function avatarTone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function loadLevel(load: number) {
  return load >= 80 ? "high" : load >= 50 ? "mid" : "low";
}

export function AdminCoachesCommandCenter({ records }: { records: AdminCoachRecord[] }) {
  const router = useRouter();
  const { showToast } = useDashboardToast();
  const [pending, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [form, setForm] = useState<CoachForm>(emptyForm);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);
  const [resetLink, setResetLink] = useState<PasswordResetLink | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...records]
      .filter(
        (coach) =>
          !term ||
          coach.fullName.toLowerCase().includes(term) ||
          coach.specialization.toLowerCase().includes(term),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [records, query]);

  function openCreate() {
    setEditingId(null); setForm(emptyForm); setDeleteMode(false); setConfirmation(""); setError(""); setEditorOpen(true);
  }
  function openEdit(coach: AdminCoachRecord) {
    setEditingId(coach.id); setForm({ fullName: coach.fullName, email: coach.email, phone: coach.phone, specialization: coach.specialization }); setDeleteMode(false); setConfirmation(""); setError(""); setEditorOpen(true);
  }
  function openDelete(coach: AdminCoachRecord) {
    setEditingId(coach.id); setForm({ fullName: coach.fullName, email: coach.email, phone: coach.phone, specialization: coach.specialization }); setDeleteMode(true); setConfirmation(""); setError(""); setEditorOpen(true);
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    startTransition(async () => {
      try { const result = await saveCoach({ coachId: editingId, ...form }); setEditorOpen(false); if (result.credentials) setCredentials({ accountType: "coach", ...result.credentials }); showToast(editingId ? "Coach updated." : "Coach added."); router.refresh(); }
      catch (caught) { const description = caught instanceof Error ? caught.message : "Could not save coach."; setError(description); showToast(description, "warning"); }
    });
  }
  function removeCoach() {
    if (!editingId) return;
    setError(""); startTransition(async () => {
      try { await deleteCoach({ coachId: editingId, confirmationText: confirmation }); setEditorOpen(false); showToast("Coach deleted."); router.refresh(); }
      catch (caught) { const description = caught instanceof Error ? caught.message : "Could not delete coach."; setError(description); showToast(description, "warning"); }
    });
  }
  function issueResetLink() {
    if (!editingId) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await issueAccountPasswordResetLink({ profileId: editingId, profileType: "coach" });
        setEditorOpen(false);
        setResetLink({
          accountName: form.fullName,
          accountType: "coach",
          expiresAt: result.expiresAt,
          url: new URL(result.path, window.location.origin).toString(),
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not issue a reset link.");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={pending}>
      <section className={styles.board}>
        <header className={styles.controls}>
          <h2>Coaches</h2>
          <button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><Plus size={17} /> New coach</button>
        </header>

        {visible.length ? <div className={styles.coachGrid}>{visible.map((coach) => { const state=coachState(coach); const load=Math.min(100,Math.round(coach.sessionsThisWeek/12*100)); return <article className={styles.coachCard} key={coach.id}>
          <header><span className={styles.avatar}>{getInitials(coach.fullName)}</span><div><h2>{coach.fullName}</h2><small>{coach.specialization} · {coach.email}</small></div><span className={`${styles.state} ${state.className}`}>{coach.openSlots ? `${coach.openSlots} free ${coach.openSlots === 1 ? "slot" : "slots"}` : state.label}</span><button type="button" onClick={()=>openEdit(coach)} aria-label={`Edit ${coach.fullName}`}><Pencil size={13}/></button><button type="button" className={styles.deleteIcon} onClick={()=>openDelete(coach)} aria-label={`Delete ${coach.fullName}`}><Trash2 size={13}/></button></header>
          <div className={styles.timeline}>{coach.weeklyLoad.map((day)=><span key={day.day}><i data-active={day.sessions>0||undefined} style={{opacity:day.sessions ? Math.min(1,.5+day.sessions*.2) : 1}}/><small>{day.day.slice(0,1)}</small></span>)}</div>
          <footer><div><strong>{coach.sessionsThisWeek}</strong><small>{coach.sessionsThisWeek === 1 ? "Session/wk" : "Sessions/wk"}</small></div><div><strong>{coach.activeClients}</strong><small>{coach.activeClients === 1 ? "Client" : "Clients"}</small></div><div className={styles.loadLine}><span>Weekly load <b>{load}%</b></span><i><b style={{width:`${load}%`}}/></i></div></footer>
        </article>})}</div> : <div className={styles.empty}><Users size={24}/><strong>No coaches yet</strong><span>Add your first coach to get started.</span></div>}
      </section>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{editingId ? "Manage coach" : "Add a coach"}</Dialog.Title><Dialog.Description>Maintain the coach account and core training specialty.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close coach editor"><X size={18} /></Dialog.Close>
        {!deleteMode ? <form onSubmit={submit} className={styles.form}><label className={styles.full}>Full name<input required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></label><label>Phone<input type="tel" value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} /></label><label className={styles.full}>Specialty<select value={form.specialization} onChange={(event) => setForm((value) => ({ ...value, specialization: event.target.value as AdminCoachSpecialization }))}>{specialties.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select></label>{error ? <p className={`${styles.error} ${styles.full}`} role="alert">{error}</p> : null}<div className={`${styles.formActions} ${styles.full}`}>{editingId ? <><button type="button" className={styles.deleteButton} onClick={() => setDeleteMode(true)}><Trash2 size={16} /> Delete</button><button type="button" className="mv-btn mv-btn-secondary" onClick={issueResetLink} disabled={pending}><KeyRound size={16} /> Reset access</button></> : <span />}<button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save coach"}</button></div></form> : <div className={styles.deletePanel}><Trash2 size={25} /><h3>Delete this coach?</h3><p>Assigned groups or sessions must be moved first. Type Delete to confirm.</p><label>Confirmation<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Delete" /></label>{error ? <p className={styles.error} role="alert">{error}</p> : null}<div><button className="mv-btn mv-btn-secondary" onClick={() => setDeleteMode(false)}>Back</button><button className={styles.deleteButton} onClick={removeCoach} disabled={confirmation !== "Delete" || pending}>Delete permanently</button></div></div>}
      </Dialog.Content></Dialog.Portal></Dialog.Root>
      <TemporaryCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
      <PasswordResetLinkDialog resetLink={resetLink} onClose={() => setResetLink(null)} />
    </div>
  );
}
