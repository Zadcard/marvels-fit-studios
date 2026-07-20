"use client";

import { Check, FileText, UserMinus, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  assignCoachClientToSession,
  markCoachSessionAttendance,
  removeCoachClientFromSession,
} from "@/app/actions/coach-session-bookings";
import { saveCoachSessionNote } from "@/app/actions/coach-session-notes";
import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";
import styles from "./coach-session-workspace.module.css";

type ClientOption = { id: string; fullName: string };

export function CoachSessionWorkspace({
  sessions,
  clientOptions,
  initialSessionId,
}: {
  sessions: CoachSessionRecord[];
  clientOptions: ClientOption[];
  initialSessionId?: string | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(
    sessions.some((session) => session.id === initialSessionId)
      ? initialSessionId ?? ""
      : sessions[0]?.id ?? "",
  );
  const selected = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null,
    [selectedId, sessions],
  );
  const [note, setNote] = useState(selected?.noteValue ?? "");
  const [clientId, setClientId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => setNote(selected?.noteValue ?? ""), [selected]);
  useEffect(() => {
    if (initialSessionId && sessions.some((session) => session.id === initialSessionId)) {
      setSelectedId(initialSessionId);
    }
  }, [initialSessionId, sessions]);

  const availableClients = clientOptions.filter(
    (client) => !selected?.bookings.some((booking) => booking.clientId === client.id),
  );

  function run(operation: () => Promise<unknown>, success: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await operation();
        setMessage(success);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The session could not be updated.");
      }
    });
  }

  function chooseSession(sessionId: string) {
    setSelectedId(sessionId);
    setClientId("");
    setError("");
    setMessage("");
    router.replace(`/coach/sessions?session=${encodeURIComponent(sessionId)}`, { scroll: false });
  }

  if (!sessions.length) {
    return <section className={styles.empty}><h2>No assigned sessions</h2><p>Sessions assigned to your coach profile will appear here.</p></section>;
  }

  return <div className={styles.workspace}>
    <aside className={styles.sessionList} aria-label="Assigned sessions">
      <header><span>My sessions</span><strong>{sessions.length}</strong></header>
      {sessions.map((session) => <button key={session.id} type="button" data-active={session.id === selected?.id || undefined} onClick={() => chooseSession(session.id)}>
        <time>{session.dayLabel}<b>{session.timeLabel}</b></time>
        <span><strong>{session.title}</strong><small>{session.sessionType} &middot; {session.rosterLabel}</small></span>
      </button>)}
    </aside>

    {selected ? <section className={styles.detail}>
      <header><div><span>{selected.dayLabel} &middot; {selected.timeLabel}</span><h2>{selected.title}</h2><p>{selected.focus}</p></div><b data-status={selected.status}>{selected.status}</b></header>
      <div className={styles.meta}><span>{selected.sessionType}</span><span>{selected.rosterLabel}</span></div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {message ? <p className={styles.success} role="status">{message}</p> : null}

      <section className={styles.roster}>
        <header><div><h3>Roster &amp; attendance</h3><p>Changes persist immediately and remain scoped to this session.</p></div></header>
        {selected.bookings.length ? selected.bookings.map((booking) => <article key={booking.clientId}>
          <span><strong>{booking.fullName}</strong><small>{booking.hasInjuryAlert ? booking.injuryNotes || booking.restrictions : booking.status}</small></span>
          <div className={styles.statusActions}>
            <button type="button" data-active={booking.status === "Attended" || undefined} disabled={pending} onClick={() => run(() => markCoachSessionAttendance(selected.id, booking.clientId, booking.status === "Attended" ? "BOOKED" : "ATTENDED"), booking.status === "Attended" ? "Check-in cleared." : "Attendance saved.")}><Check size={14} /> In</button>
            <button type="button" data-active={booking.status === "Missed" || undefined} disabled={pending} onClick={() => run(() => markCoachSessionAttendance(selected.id, booking.clientId, booking.status === "Missed" ? "BOOKED" : "MISSED"), booking.status === "Missed" ? "Absence cleared." : "Absence saved.")}><X size={14} /> Missed</button>
            <button type="button" className={styles.remove} disabled={pending} aria-label={`Remove ${booking.fullName} from session`} onClick={() => run(() => removeCoachClientFromSession(selected.id, booking.clientId), "Client removed from the session.")}><UserMinus size={14} /></button>
          </div>
        </article>) : <p className={styles.emptyRoster}>No clients are booked.</p>}
        <div className={styles.addClient}><select aria-label="Client to add" value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Select a client from my roster</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select><button type="button" disabled={!clientId || pending} onClick={() => run(async () => { await assignCoachClientToSession(selected.id, clientId); setClientId(""); }, "Client added to the session.")}><UserPlus size={15} /> Add</button></div>
      </section>

      <form className={styles.note} onSubmit={(event) => { event.preventDefault(); run(() => saveCoachSessionNote(selected.id, note), "Session note saved."); }}>
        <label htmlFor="coach-session-note"><FileText size={15} /> Coach session note</label>
        <textarea id="coach-session-note" maxLength={1000} required value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record preparation, progress, or follow-up context..." />
        <footer><small>{note.length}/1000</small><button type="submit" disabled={!note.trim() || pending}>{pending ? "Saving..." : "Save note"}</button></footer>
      </form>
    </section> : null}
  </div>;
}
