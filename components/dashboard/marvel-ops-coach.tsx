"use client";

import { AlertTriangle, CalendarDays, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";
import styles from "./marvel-ops-coach.module.css";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

export function MarvelOpsCoachToday({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  const todaySessions = sessions.filter((session) => session.dayLabel === "Today");
  const injuryBookings = sessions.flatMap((session) => session.bookings).filter((booking) => booking.hasInjuryAlert);

  return <div className={styles.page}><header className={styles.greeting}><i>{initials(coachName)}</i><div><span>Coach · Today</span><h1>Morning, {coachName.split(" ")[0]}</h1></div><section><b>{sessions.length}<small>Sessions</small></b><b>{new Set(sessions.flatMap((session) => session.bookings.map((booking) => booking.clientId))).size}<small>My clients</small></b></section></header><div className={styles.grid}><section className={styles.panel}><header><h2>My sessions today</h2><button type="button" onClick={() => router.push("/coach/schedule")}>Full week</button></header>{todaySessions.length ? todaySessions.map((session) => <article className={styles.session} key={session.id}><time>{session.timeLabel}</time><div><strong>{session.title}</strong><small>{session.status} · {session.rosterLabel}</small><p>{session.bookings.slice(0, 4).map((booking) => <i key={booking.clientId} data-alert={booking.hasInjuryAlert || undefined}>{initials(booking.fullName)}</i>)}</p></div><button type="button" onClick={() => router.push(`/coach/sessions?session=${encodeURIComponent(session.id)}`)}>Open roster</button></article>) : <p>No sessions are scheduled for you today.</p>}</section><aside><section className={styles.panel}><h2><AlertTriangle size={16} /> Injuries to watch</h2>{injuryBookings.length ? injuryBookings.slice(0, 3).map((booking, idx) => <button key={`${booking.clientId}-${idx}`} type="button" className={styles.injuryLink} onClick={() => router.push(`/coach/clients?client=${encodeURIComponent(booking.clientId)}`)}><i>{initials(booking.fullName)}</i><span><b>{booking.fullName}</b><small>{booking.injuryNotes || booking.restrictions}</small></span></button>) : <p>No injury flags in your current roster.</p>}</section></aside></div></div>;
}

export function MarvelOpsCoachPhone({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  const nextSession = sessions.find((session) => session.dayLabel === "Today") ?? sessions[0];
  const alert = sessions.flatMap((session) => session.bookings).find((booking) => booking.hasInjuryAlert);

  return <div className={styles.phonePage}><section className={styles.phone}><div className={styles.notch} /><header><i>{initials(coachName)}</i><span><b>{coachName}</b><small>Coach</small></span></header><p>Up next · Today</p>{nextSession ? <article><strong>{nextSession.title}</strong><small>{nextSession.timeLabel}</small><b>{nextSession.rosterLabel}</b></article> : <p>No upcoming session.</p>}<h2>Injuries to watch</h2>{alert ? <button type="button" className={styles.injury} onClick={() => router.push(`/coach/clients?client=${encodeURIComponent(alert.clientId)}`)}><i>{initials(alert.fullName)}</i><span><b>{alert.fullName}</b><small>{alert.injuryNotes || alert.restrictions}</small></span></button> : <p>No injury flags.</p>}<nav><button type="button" onClick={() => router.push("/coach")}>Today</button><button type="button" onClick={() => router.push("/coach/schedule")}><CalendarDays size={15} />Week</button><button type="button" onClick={() => router.push("/coach/clients")}><Users size={15} />Clients</button></nav></section></div>;
}
