"use client";

import { AlertTriangle, CalendarDays, ChevronRight, Clock, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";
import { EntityDialog } from "@/components/ui/entity-form";
import styles from "./marvel-ops-coach.module.css";

const tones = ["red", "green", "violet", "blue", "amber"] as const;

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

export function MarvelOpsCoachToday({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<CoachSessionRecord | null>(null);
  const todaySessions = sessions.filter((session) => session.dayLabel === "Today");
  const injuryBookings = sessions.flatMap((session) => session.bookings).filter((booking) => booking.hasInjuryAlert);

  return (
    <div className={styles.page}>
      <header className={styles.greeting}>
        <i>{initials(coachName)}</i>
        <div>
          <span>Coach · Today</span>
          <h1>Morning, {coachName.split(" ")[0]}</h1>
        </div>
        <section>
          <b>
            {sessions.length}
            <small>Sessions</small>
          </b>
          <b>
            {new Set(sessions.flatMap((session) => session.bookings.map((booking) => booking.clientId))).size}
            <small>My clients</small>
          </b>
        </section>
      </header>

      <div className={styles.grid}>
        <section className={styles.sessionsPanel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.panelTag}>TODAY</span>
              <h2>My Sessions Today</h2>
            </div>
            <button type="button" className={styles.headerBtn} onClick={() => router.push("/coach/schedule")}>
              Full week
            </button>
          </header>

          <div className={styles.sessionList}>
            {todaySessions.map((session, index) => (
              <button
                type="button"
                key={session.id}
                className={styles.sessionItem}
                data-live={session.isLive || undefined}
                onClick={() => setSelectedSession(session)}
              >
                <time className={styles.sessionTime}>
                  <strong>{session.timeLabel}</strong>
                  <small className={session.isLive ? styles.liveSmall : undefined}>
                    {session.isLive ? "LIVE NOW" : session.durationLabel}
                  </small>
                </time>
                <span className={styles.sessionTitle}>
                  <i data-tone={tones[index % tones.length]}>{initials(session.title)}</i>
                  <b>
                    {session.title}
                    <small>
                      {session.sessionType} · {session.rosterLabel}
                    </small>
                  </b>
                </span>
                <span className={styles.occupancy}>
                  <strong>{session.bookedCount}</strong>
                  <small>checked in</small>
                </span>
                <ChevronRight size={16} className={styles.arrowIcon} />
              </button>
            ))}
            {!todaySessions.length ? (
              <p className={styles.panelEmpty}>No sessions are scheduled for you today.</p>
            ) : null}
          </div>
        </section>

        <aside>
          <section className={styles.panel}>
            <h2>
              <AlertTriangle size={16} /> Injuries to watch
            </h2>
            {injuryBookings.length ? (
              injuryBookings.slice(0, 3).map((booking, idx) => (
                <button
                  key={`${booking.clientId}-${idx}`}
                  type="button"
                  className={styles.injuryLink}
                  onClick={() => router.push(`/coach/clients?client=${encodeURIComponent(booking.clientId)}`)}
                >
                  <i>{initials(booking.fullName)}</i>
                  <span>
                    <b>{booking.fullName}</b>
                    <small>{booking.injuryNotes || booking.restrictions}</small>
                  </span>
                </button>
              ))
            ) : (
              <p>No injury flags in your current roster.</p>
            )}
          </section>
        </aside>
      </div>

      {selectedSession ? (
        <EntityDialog
          open
          onOpenChange={(open) => !open && setSelectedSession(null)}
          title={`Session: ${selectedSession.title}`}
          description="Session details and roster for today."
          closeLabel="Close session inspection"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderGrid}>
              <div className={styles.modalBadgeRow}>
                <span className={styles.modalTag}>
                  <Clock size={13} /> {selectedSession.timeLabel}
                </span>
                <span className={styles.modalTag}>{selectedSession.durationLabel}</span>
                <span className={styles.modalTag} data-live={selectedSession.isLive || undefined}>
                  {selectedSession.isLive ? "LIVE NOW" : selectedSession.sessionType}
                </span>
              </div>
            </div>

            <div className={styles.modalDetailRows}>
              <div className={styles.modalDetailRow}>
                <span>Session Type</span>
                <strong>{selectedSession.sessionType}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Checked-In Bookings</span>
                <strong>{selectedSession.bookedCount} clients</strong>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className="mv-btn mv-btn-secondary" onClick={() => setSelectedSession(null)}>
                Close
              </button>
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                onClick={() => {
                  setSelectedSession(null);
                  router.push(`/coach/sessions?session=${encodeURIComponent(selectedSession.id)}`);
                }}
              >
                <UserCheck size={15} /> Open Attendance & Roster
              </button>
            </div>
          </div>
        </EntityDialog>
      ) : null}
    </div>
  );
}

export function MarvelOpsCoachPhone({ coachName, sessions }: { coachName: string; sessions: CoachSessionRecord[] }) {
  const router = useRouter();
  const nextSession = sessions.find((session) => session.dayLabel === "Today") ?? sessions[0];
  const alert = sessions.flatMap((session) => session.bookings).find((booking) => booking.hasInjuryAlert);

  return <div className={styles.phonePage}><section className={styles.phone}><div className={styles.notch} /><header><i>{initials(coachName)}</i><span><b>{coachName}</b><small>Coach</small></span></header><p>Up next · Today</p>{nextSession ? <article><strong>{nextSession.title}</strong><small>{nextSession.timeLabel}</small><b>{nextSession.rosterLabel}</b></article> : <p>No upcoming session.</p>}<h2>Injuries to watch</h2>{alert ? <button type="button" className={styles.injury} onClick={() => router.push(`/coach/clients?client=${encodeURIComponent(alert.clientId)}`)}><i>{initials(alert.fullName)}</i><span><b>{alert.fullName}</b><small>{alert.injuryNotes || alert.restrictions}</small></span></button> : <p>No injury flags.</p>}<nav><button type="button" onClick={() => router.push("/coach")}>Today</button><button type="button" onClick={() => router.push("/coach/schedule")}><CalendarDays size={15} />Week</button><button type="button" onClick={() => router.push("/coach/clients")}><Users size={15} />Clients</button></nav></section></div>;
}
