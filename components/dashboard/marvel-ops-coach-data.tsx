"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { CoachClientRecord } from "@/lib/dashboard/coach-client-record";
import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";

import styles from "./marvel-ops-expansion.module.css";

export function MarvelOpsCoachSchedule({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  return <div className={styles.page}><section className={styles.coachHero}><span>{coachName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><h2>My weekly schedule</h2><p>{coachName} · database sessions</p></div><b>{sessions.length} sessions</b></section><section className={styles.scheduleBoard}><header><div><h2>Scheduled sessions</h2><p>Upcoming and recent sessions assigned to you</p></div></header><div className={styles.coachScheduleList}>{sessions.map((session) => <article key={session.id}><time>{session.timeLabel}</time><span className={styles.sessionTone} data-tone={session.sessionType === "Private" ? "violet" : "red"} /><div><strong>{session.title}</strong><small>{session.dayLabel} · {session.location}</small></div><b>{session.rosterLabel}</b><button type="button" disabled>Open session <ChevronRight size={14} /></button></article>)}</div></section></div>;
}

export function MarvelOpsCoachClients({ clients, initialClientId = null }: { clients: CoachClientRecord[]; initialClientId?: string | null }) {
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [selected, setSelected] = useState<CoachClientRecord | null>(null);
  const visible = attentionOnly ? clients.filter((client) => client.hasInjuryAlert) : clients;
  useEffect(() => {
    setSelected(clients.find((client) => client.id === initialClientId) ?? null);
  }, [clients, initialClientId]);
  return <div className={styles.page}><section className={styles.clientHero}><div><span>MY ROSTER</span><h2>Clients I coach</h2><p>Live client, injury, and session context.</p></div><div><button type="button" data-active={!attentionOnly || undefined} onClick={() => setAttentionOnly(false)}>All</button><button type="button" data-active={attentionOnly || undefined} onClick={() => setAttentionOnly(true)}>Attention</button></div></section><section className={styles.coachClientTable}><header><span>Client</span><span>Program</span><span>Coach note</span><span>Status</span></header>{visible.map((client) => <article key={client.id} role="button" tabIndex={0} onClick={() => setSelected(client)} onKeyDown={(event) => { if (event.key === "Enter") setSelected(client); }}><span className={styles.clientName}><i data-tone={client.hasInjuryAlert ? "amber" : "blue"}>{client.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><b>{client.fullName}</b></span><span>{client.trainingCategory}</span><span data-warning={client.hasInjuryAlert || undefined}>{client.hasInjuryAlert ? <AlertTriangle size={14} /> : null}{client.injuryNotes || client.restrictions || "No current restrictions"}</span><b data-status={client.status}>{client.status}</b></article>)}</section>{selected ? <section className={styles.clientDetail} role="dialog"><button type="button" onClick={() => setSelected(null)}>Close</button><span>Client context</span><h2>{selected.fullName}</h2><p>{selected.currentFocus}</p><strong>{selected.progressNote}</strong></section> : null}</div>;
}
