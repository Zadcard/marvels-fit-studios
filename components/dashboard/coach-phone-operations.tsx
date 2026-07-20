import Link from "next/link";
import { CalendarDays, Smartphone, Users } from "lucide-react";

import type { CoachSessionRecord } from "@/lib/dashboard/coach-session-data";
import { getInitials } from "@/lib/utils";
import styles from "./coach-phone-operations.module.css";

type Props = { coachName: string; sessions: CoachSessionRecord[] };

export function CoachPhoneOperations({ coachName, sessions }: Props) {
  const next = sessions[0] ?? null;
  const injury = next?.bookings.find((booking) => booking.hasInjuryAlert) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.phoneWrap}>
        <section className={styles.phone} aria-label="Coach mobile operations view">
          <header><span className={styles.avatar}>{getInitials(coachName)}</span><span><strong>{coachName}</strong><small>Coach</small></span></header>
          <p>Up next · {next ? next.dayLabel : "No session"}</p>
          {next ? <article className={styles.next}><div><strong>{next.title}</strong><small>{next.sessionType}</small></div><time>{next.timeLabel}</time><b>{next.rosterLabel}</b><Link href="/coach/schedule">View schedule</Link></article> : <div className={styles.empty}>No assigned sessions.</div>}
          <h2>Injuries to watch</h2>
          {injury ? <article className={styles.injury}><span>{getInitials(injury.fullName)}</span><div><strong>{injury.fullName}</strong><small>{injury.injuryStatus} · {injury.injuryNotes}</small></div></article> : <div className={styles.empty}>No injury alert in the next roster.</div>}
          <nav><Link href="/coach"><Smartphone size={17} />Today</Link><Link href="/coach/schedule"><CalendarDays size={17} />Week</Link><Link href="/coach/clients"><Users size={17} />Clients</Link></nav>
        </section>
      </div>
      <section className={styles.explainer}><span>Coach on mobile</span><h2>Everything a coach needs — nothing they don&apos;t.</h2><p>The coach view uses the same live session, roster, and injury data as the desktop workspace. Attendance mutation remains disabled until coach-level attendance permission is added.</p><ul><li>Today and this week&apos;s schedule</li><li>Groups and private clients</li><li>Injuries surfaced beside the roster</li><li>No fake attendance or schedule-change actions</li></ul></section>
    </div>
  );
}
