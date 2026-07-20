import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import type { CoachClientRecord } from "@/lib/dashboard/coach-client-record";
import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";
import { getInitials } from "@/lib/utils";
import styles from "./coach-today-operations.module.css";

type Props = { coachName: string; sessions: CoachSessionRecord[]; clients: CoachClientRecord[] };

export function CoachTodayOperations({ coachName, sessions, clients }: Props) {
  const injuryClients = clients.filter((client) => client.hasInjuryAlert);
  const visibleSessions = sessions.slice(0, 4);

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <span className={styles.avatar}>{getInitials(coachName)}</span>
        <div><h2>Morning, {coachName}</h2><p>Coach · {new Intl.DateTimeFormat("en-US", { weekday: "long", day: "2-digit", month: "long" }).format(new Date())}</p></div>
        <div className={styles.welcomeStats}><article><strong>{sessions.length}</strong><span>Sessions/wk</span></article><article><strong>{clients.length}</strong><span>My clients</span></article></div>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <header><h2>My sessions today</h2><Link href="/coach/schedule">Full week <ArrowRight size={14} /></Link></header>
          {visibleSessions.length ? <div className={styles.sessions}>{visibleSessions.map((session) => (
            <article key={session.id}>
              <div className={styles.sessionTop}>
                <time><strong>{session.timeLabel}</strong><small>{session.dayLabel}</small></time>
                <div><span><strong>{session.title}</strong><b data-status={session.status}>{session.status}</b></span><small>{session.sessionType} · {session.rosterLabel}</small></div>
                <Link href="/coach/sessions">Open session</Link>
              </div>
              {session.bookings.length ? <div className={styles.roster}>{session.bookings.slice(0, 8).map((booking) => <span key={booking.clientId} data-alert={booking.hasInjuryAlert || undefined}>{getInitials(booking.fullName)}<small>{booking.fullName}</small></span>)}</div> : <p className={styles.empty}>No clients booked.</p>}
            </article>
          ))}</div> : <p className={styles.empty}>No assigned sessions are in view.</p>}
        </section>

        <aside className={styles.side}>
          <section className={`${styles.panel} ${styles.injuries}`}>
            <header><h2><AlertTriangle size={16} /> Injuries to watch</h2></header>
            {injuryClients.length ? injuryClients.slice(0, 5).map((client) => (
              <article key={client.id}><span className={styles.smallAvatar}>{getInitials(client.fullName)}</span><span><strong>{client.fullName}</strong><small>{client.injuryStatus} · {client.injuryNotes || client.restrictions}</small></span><Link href={`/coach/clients/${client.id}/transformation`}>Open</Link></article>
            )) : <p className={styles.empty}>No active injury alerts.</p>}
          </section>
          <section className={styles.panel}>
            <header><h2>Schedule changes</h2></header>
            <div className={styles.backendGap}><strong>Request workflow not connected</strong><p>The database records completed schedule changes, but it does not yet store client change requests for coach approval.</p><button type="button" disabled>Review requests</button></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
