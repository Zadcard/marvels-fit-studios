"use client";

import { AlertTriangle, ChevronRight, Download, FileUp, Pencil, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  savePrivateClientNote,
  uploadCoachFile,
} from "@/app/actions/coach-client-assets";
import type { CoachClientRecord } from "@/lib/dashboard/coach-client-record";
import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";
import styles from "./marvel-ops-expansion.module.css";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function MarvelOpsCoachSchedule({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  return <div className={styles.page}>
    <section className={styles.coachHero}><span>{initials(coachName)}</span><div><h2>My weekly schedule</h2><p>{coachName} &middot; database sessions</p></div><b>{sessions.length} {sessions.length === 1 ? "session" : "sessions"}</b></section>
    <section className={styles.scheduleBoard}>
      <header><div><h2>Scheduled sessions</h2><p>Upcoming and recent sessions assigned to you</p></div></header>
      <div className={styles.coachScheduleList}>{sessions.map((session) => <article key={session.id}><time>{session.timeLabel}</time><span className={styles.sessionTone} data-tone={session.sessionType === "Private" ? "violet" : "red"} /><div><strong>{session.title}</strong><small>{session.dayLabel} &middot; {session.location}</small></div><b>{session.rosterLabel}</b><button type="button" onClick={() => router.push(`/coach/sessions?session=${encodeURIComponent(session.id)}`)}>Open session <ChevronRight size={14} /></button></article>)}{!sessions.length ? <p className={styles.coachScheduleEmpty}>No sessions scheduled this week.</p> : null}</div>
    </section>
  </div>;
}

export function MarvelOpsCoachClients({ clients, initialClientId = null }: { clients: CoachClientRecord[]; initialClientId?: string | null }) {
  const router = useRouter();
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = useMemo(
    () => clients.find((client) => client.id === selectedId) ?? null,
    [clients, selectedId],
  );
  const visible = attentionOnly ? clients.filter((client) => client.hasInjuryAlert) : clients;

  useEffect(() => {
    setSelectedId(clients.find((client) => client.id === initialClientId)?.id ?? null);
  }, [clients, initialClientId]);

  function run(operation: () => Promise<unknown>, success: string, after?: () => void) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await operation();
        after?.();
        setMessage(success);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The client record could not be updated.");
      }
    });
  }

  function openClient(clientId: string) {
    setSelectedId(clientId);
    setNoteId(null);
    setNoteContent("");
    setMessage("");
    setError("");
  }

  return <div className={styles.page}>
    <section className={styles.clientHero}><div><span>MY ROSTER</span><h2>Clients I coach</h2><p>Live client, injury, notes, and training assets.</p></div><div><button type="button" data-active={!attentionOnly || undefined} onClick={() => setAttentionOnly(false)}>All</button><button type="button" data-active={attentionOnly || undefined} onClick={() => setAttentionOnly(true)}>Attention</button></div></section>
    <section className={styles.coachClientTable}>
      <header><span>Client</span><span>Program</span><span>Coach note</span><span>Status</span></header>
      {visible.map((client) => <button className={styles.clientRow} key={client.id} type="button" onClick={() => openClient(client.id)}><span className={styles.clientName}><i data-tone={client.hasInjuryAlert ? "amber" : "blue"}>{initials(client.fullName)}</i><b>{client.fullName}</b></span><span>{client.trainingCategory}</span><span data-warning={client.hasInjuryAlert || undefined}>{client.hasInjuryAlert ? <AlertTriangle size={14} /> : null}{client.injuryNotes || client.restrictions || "No current restrictions"}</span><b data-status={client.status}>{client.status}</b></button>)}
      {!visible.length ? <p className={styles.coachClientEmpty}>No clients match this view.</p> : null}
    </section>

    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.clientDialogOverlay} />
        <Dialog.Content className={styles.clientDialog}>
          <Dialog.Close asChild><button className={styles.clientDialogClose} type="button" aria-label="Close client details"><X size={18} /></button></Dialog.Close>
          {selected ? <>
            <Dialog.Title>{selected.fullName}</Dialog.Title>
            <Dialog.Description>{selected.planType} &middot; {selected.groupName} &middot; {selected.trainingCategory}</Dialog.Description>
            {error ? <p className={styles.clientError} role="alert">{error}</p> : null}
            {message ? <p className={styles.clientSuccess} role="status">{message}</p> : null}
            <section className={styles.clientContext}><h3>Current context</h3><p>{selected.currentFocus}</p><strong>{selected.progressNote}</strong>{selected.hasInjuryAlert ? <span><AlertTriangle size={13} /> {selected.injuryNotes || selected.restrictions}</span> : null}</section>

            <section className={styles.clientAssets}>
              <header><div><h3>Private coach notes</h3><p>Visible to studio staff, not the client.</p></div></header>
              {selected.privateNotes.map((note) => <article key={note.id}><div><p>{note.content}</p><small>{note.authorName} &middot; {note.updatedAtLabel}</small></div>{note.canEdit ? <button type="button" onClick={() => { setNoteId(note.id); setNoteContent(note.content); }}><Pencil size={13} /> Edit</button> : null}</article>)}
              {!selected.privateNotes.length ? <p className={styles.assetEmpty}>No private notes yet.</p> : null}
              <form onSubmit={(event) => { event.preventDefault(); run(() => savePrivateClientNote({ clientId: selected.id, noteId, content: noteContent }), noteId ? "Note updated." : "Note added.", () => { setNoteId(null); setNoteContent(""); }); }}>
                <textarea required maxLength={2000} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="Add private coaching context..." />
                <footer>{noteId ? <button type="button" onClick={() => { setNoteId(null); setNoteContent(""); }}>Cancel edit</button> : <span />}<button type="submit" disabled={!noteContent.trim() || pending}>{pending ? "Saving..." : noteId ? "Update note" : "Add note"}</button></footer>
              </form>
            </section>

            <section className={styles.clientAssets}>
              <header><div><h3>Training files</h3><p>Your active uploads expire after three days.</p></div></header>
              {selected.activeFiles.map((file) => <article key={file.id}><div><p>{file.name}</p><small>{file.note} &middot; expires {file.expiresAtLabel}</small></div><a href={`/api/files/${encodeURIComponent(file.id)}/download`}><Download size={13} /> Download</a></article>)}
              {!selected.activeFiles.length ? <p className={styles.assetEmpty}>No active files.</p> : null}
              <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); data.set("scope", "client"); data.set("targetId", selected.id); run(() => uploadCoachFile(data), "File uploaded for three days.", () => form.reset()); }}>
                <input required name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.xls,.xlsx" />
                <input name="note" maxLength={200} placeholder="Optional file note" />
                <footer><span /><button type="submit" disabled={pending}><FileUp size={14} /> {pending ? "Uploading..." : "Upload file"}</button></footer>
              </form>
            </section>
          </> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
