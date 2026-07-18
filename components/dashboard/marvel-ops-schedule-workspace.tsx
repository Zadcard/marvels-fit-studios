"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Check, ChevronLeft, ChevronRight, Clock3, MapPin, ShieldUser, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";

import styles from "./marvel-ops-schedule-workspace.module.css";

type Tone = "red" | "green" | "violet" | "teal" | "blue" | "amber";
export type MarvelOpsScheduleSession = { id: string; day: number; time: string; title: string; coach: string; coachInitials: string; tone: Tone; capacity: string; location: string; note: string; flags?: string };
export type MarvelOpsScheduleRequest = { id: string; name: string; initials: string; tone: Tone; kind: string; reason: string; detail: string };

const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export function MarvelOpsScheduleWorkspace({ sessions = [], requests = [] }: { sessions?: MarvelOpsScheduleSession[]; requests?: MarvelOpsScheduleRequest[] }) {
  const [selected, setSelected] = useState<MarvelOpsScheduleSession | null>(null);
  const [resolved, setResolved] = useState<Record<string, "approved" | "declined">>({});
  const [reviewing, setReviewing] = useState<MarvelOpsScheduleRequest | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const visibleRequests = useMemo(() => requests.filter((request) => !resolved[request.id]), [requests, resolved]);
  const times = [...new Set(sessions.map((session) => session.time))].sort((left, right) => new Date(`2000-01-01 ${left}`).getTime() - new Date(`2000-01-01 ${right}`).getTime());

  return <div className={styles.page}>
    <section className={styles.schedule} aria-label="Recurring schedule">
      <div className={styles.week}>
        <header className={styles.weekTitle}>
          <div><h2>Recurring week</h2><small>{weekOffset === 0 ? "This week" : weekOffset > 0 ? `${weekOffset} week${weekOffset === 1 ? "" : "s"} ahead` : `${Math.abs(weekOffset)} week${weekOffset === -1 ? "" : "s"} back`} · database sessions</small></div>
          <span><button type="button" aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)}><ChevronLeft size={16} /></button><button type="button" aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)}><ChevronRight size={16} /></button></span>
        </header>
        <div className={styles.weekGrid}>
          <div className={styles.corner} />
          {days.map((day) => <div className={styles.day} key={day}>{day}</div>)}
          {times.map((time) => <FragmentRow key={time} time={time} sessions={sessions} selectedId={selected?.id} onSelect={setSelected} />)}
        </div>
      </div>
      <aside className={styles.requests}>
        <header><h2>Change requests</h2><small>{visibleRequests.length} waiting · one-off vs recurring</small></header>
        {visibleRequests.length ? visibleRequests.map((request) => <article key={request.id}><i data-tone={request.tone}>{request.initials}</i><span><strong>{request.name}</strong><small>{request.reason}</small><em>{request.kind}</em><p>{request.detail}</p><div><button type="button" onClick={() => setReviewing(request)}>Review</button><button type="button" onClick={() => setResolved((current) => ({ ...current, [request.id]: "declined" }))}>Decline</button></div></span></article>) : <div className={styles.requestEmpty}><Check size={20} /><strong>All requests reviewed</strong><span>Database-backed requests will appear here.</span></div>}
      </aside>
    </section>
    <section className={styles.detailHint}><CalendarClock size={16} /><span>Select a session in the week to review its roster context.</span></section>
    {selected ? <SessionDrawer session={selected} onClose={() => setSelected(null)} /> : null}
    {reviewing ? <RequestReview request={reviewing} close={() => setReviewing(null)} decide={(decision) => { setResolved((current) => ({ ...current, [reviewing.id]: decision })); setReviewing(null); }} /> : null}
  </div>;
}

function FragmentRow({ time, sessions, selectedId, onSelect }: { time: string; sessions: MarvelOpsScheduleSession[]; selectedId?: string; onSelect: (session: MarvelOpsScheduleSession) => void }) {
  return <><time className={styles.time}>{time}</time>{days.map((_, day) => {
    const session = sessions.find((item) => item.time === time && item.day === day);
    return session ? <button type="button" className={styles.sessionCard} data-tone={session.tone} data-selected={selectedId === session.id || undefined} key={`${time}-${day}`} onClick={() => onSelect(session)}><strong>{session.title}</strong><small>{session.coach.split(" ")[0]}</small></button> : <span className={styles.emptyCell} key={`${time}-${day}`} />;
  })}</>;
}

function SessionDrawer({ session, onClose }: { session: MarvelOpsScheduleSession; onClose: () => void }) {
  const router = useRouter();
  return <div className={styles.drawerOverlay} onMouseDown={onClose}><aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={`${session.title} details`} onMouseDown={(event) => event.stopPropagation()}>
    <header><button type="button" className={styles.close} onClick={onClose} aria-label="Close session details"><X size={18} /></button><span>Session details</span><h2>{session.title}</h2><p><i data-tone={session.tone}>{session.coachInitials}</i>{session.coach} · {session.time}</p></header>
    <section className={styles.sessionStats}><div><span>Booked</span><strong>{session.capacity}</strong><small>members</small></div><div><span>Roster flags</span><strong>{session.flags ? "1" : "0"}</strong><small>{session.flags ?? "No alerts"}</small></div></section>
    <dl className={styles.sessionDetails}><div><dt><Clock3 size={14} /> Time</dt><dd>{session.time}<br />Scheduled occurrence</dd></div><div><dt><MapPin size={14} /> Location</dt><dd>{session.location}</dd></div><div><dt><ShieldUser size={14} /> Coach</dt><dd>{session.coach}</dd></div><div><dt><Users size={14} /> Capacity</dt><dd>{session.capacity} members</dd></div></dl>
    {session.flags ? <section className={styles.flag}><AlertTriangle size={15} /><div><strong>Roster context</strong><p>{session.flags} requires attention before the session begins.</p></div></section> : null}
    <section className={styles.focus}><span>Training focus</span><p>{session.note}</p></section>
    <footer><button type="button" onClick={onClose}>Close</button><button type="button" onClick={() => router.push(`/admin/attendance?session=${encodeURIComponent(session.id)}`)}>Open attendance</button></footer>
  </aside></div>;
}

function RequestReview({ request, close, decide }: { request: MarvelOpsScheduleRequest; close: () => void; decide: (decision: "approved" | "declined") => void }) {
  return <div className={styles.drawerOverlay} onMouseDown={close}><aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={`Review ${request.name}'s request`} onMouseDown={(event) => event.stopPropagation()}><header><button type="button" className={styles.close} onClick={close} aria-label="Close request review"><X size={18} /></button><span>Change request</span><h2>{request.name}</h2><p><i data-tone={request.tone}>{request.initials}</i>{request.kind} · {request.reason}</p></header><section className={styles.focus}><span>Requested change</span><p>{request.detail}</p></section><section className={styles.flag}><AlertTriangle size={15} /><div><strong>Scope check</strong><p>{request.kind === "Recurring" ? "Approving affects the recurring series." : "This request affects one scheduled occurrence only."}</p></div></section><footer><button type="button" onClick={() => decide("declined")}>Decline</button><button type="button" onClick={() => decide("approved")}>Approve request</button></footer></aside></div>;
}
