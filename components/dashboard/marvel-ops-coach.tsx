"use client";

import { AlertTriangle, CalendarDays, Check, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";

import styles from "./marvel-ops-coach.module.css";

export function MarvelOpsCoachToday({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const todaySessions = sessions.filter((session) => session.dayLabel === "Today");
  const injuryBookings = sessions.flatMap((session) => session.bookings).filter((booking) => booking.hasInjuryAlert);
  return <div className={styles.page}><header className={styles.greeting}><i>{coachName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><div><span>Coach · Today</span><h1>Morning, {coachName.split(" ")[0]}</h1></div><section><b>{sessions.length}<small>Sessions</small></b><b>{new Set(sessions.flatMap((session) => session.bookings.map((booking) => booking.clientId))).size}<small>My clients</small></b></section></header><div className={styles.grid}><section className={styles.panel}><header><h2>My sessions today</h2><button type="button" onClick={() => router.push("/coach/schedule")}>Full week</button></header>{todaySessions.length ? todaySessions.map((session) => <article className={styles.session} key={session.id}><time>{session.timeLabel}</time><div><strong>{session.title}</strong><small>{session.status} · {session.rosterLabel}</small><p>{session.bookings.slice(0, 4).map((booking) => <i key={booking.clientId} data-alert={booking.hasInjuryAlert || undefined}>{booking.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i>)}</p></div><button type="button" data-marked={marked[session.id] || undefined} onClick={() => setMarked((current) => ({ ...current, [session.id]: !current[session.id] }))}><Check size={15} />{marked[session.id] ? "Attendance ready" : "Mark attendance"}</button></article>) : <p>No sessions are scheduled for you today.</p>}</section><aside><section className={styles.panel}><h2><AlertTriangle size={16} /> Injuries to watch</h2>{injuryBookings.length ? injuryBookings.slice(0, 3).map((booking) => <button key={booking.clientId} type="button" className={styles.injuryLink} onClick={() => router.push("/coach/clients")}><i>{booking.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><span><b>{booking.fullName}</b><small>{booking.injuryNotes || booking.restrictions}</small></span></button>) : <p>No injury flags in your current roster.</p>}</section></aside></div></div>;
}

export function MarvelOpsCoachPhone({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  const [marked, setMarked] = useState(false);
  const nextSession = sessions.find((session) => session.dayLabel === "Today") ?? sessions[0];
  const alert = sessions.flatMap((session) => session.bookings).find((booking) => booking.hasInjuryAlert);
  return <div className={styles.phonePage}><section className={styles.phone}><div className={styles.notch} /><header><i>{coachName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><span><b>{coachName}</b><small>Coach</small></span></header><p>Up next · Today</p>{nextSession ? <article><strong>{nextSession.title}</strong><small>{nextSession.timeLabel} · {nextSession.location}</small><b>{nextSession.rosterLabel}</b><button type="button" data-marked={marked || undefined} onClick={() => setMarked((value) => !value)}><Check size={15} />{marked ? "Attendance ready" : "Mark attendance"}</button></article> : <p>No upcoming session.</p>}<h2>Injuries to watch</h2>{alert ? <button type="button" className={styles.injury} onClick={() => router.push("/coach/clients")}><i>{alert.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i><span><b>{alert.fullName}</b><small>{alert.injuryNotes || alert.restrictions}</small></span></button> : <p>No injury flags.</p>}<nav><button type="button" onClick={() => router.push("/coach")}>Today</button><button type="button" onClick={() => router.push("/coach/schedule")}><CalendarDays size={15} />Week</button><button type="button" onClick={() => router.push("/coach/clients")}><Users size={15} />Clients</button></nav></section></div>;
}
