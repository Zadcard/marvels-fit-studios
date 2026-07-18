import Link from "next/link";
import { ArrowRight, CircleDollarSign } from "lucide-react";

import type { AdminTodayOperations } from "@/lib/dashboard/admin-today-operations";
import { AdminCashOutDialog } from "./admin-cash-out-dialog";
import styles from "./admin-today-operations.module.css";

type Props = { data: AdminTodayOperations };

function percentage(value: number, total: number) {
  return total ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

export function AdminTodayOperations({ data }: Props) {
  const liveNames = data.sessions.filter((session) => session.isLive).map((session) => session.coachName);

  return (
    <div className={styles.page}>
      <section className={styles.metrics} aria-label="Today at a glance">
        <article><span>On floor now</span><strong>{data.liveCount}<b> live</b></strong><small>{liveNames.length ? liveNames.join(" · ") : "No live session"}</small></article>
        <article><span>Coming today</span><strong>{data.sessions.length}</strong><small>{data.expectedClients} clients expected</small></article>
        <article data-tone="danger"><span>Trials to close</span><strong>{data.trials.length}</strong><small>Need an outcome</small></article>
        <article data-tone="warning"><span>Renew this week</span><strong>{data.renewals.length}</strong><small>Follow up before expiry</small></article>
        <article data-tone="success"><span>Cash today</span><strong>{data.cashTodayLabel}</strong><small>{data.cashTodayCount} payments in</small></article>
      </section>

      <div className={styles.dashboardGrid}>
        <div className={styles.primaryColumn}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div><h2>Today&apos;s floor</h2><p>{new Intl.DateTimeFormat("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date())}</p></div>
              <Link href="/admin/schedule" className={styles.textButton}>Full schedule <ArrowRight size={14} /></Link>
            </header>
            {data.sessions.length ? <div className={styles.sessionList}>{data.sessions.map((session) => (
              <Link href="/admin/attendance" key={session.id} className={styles.sessionRow} data-live={session.isLive || undefined}>
                <time><strong>{session.timeLabel}</strong><small>{session.durationLabel}</small></time>
                <div className={styles.sessionIdentity}>
                  <div><strong>{session.title}</strong><span>{session.sessionType}</span>{session.isLive ? <b>Live</b> : null}</div>
                  <small><i>{session.coachInitials}</i>{session.coachName} · {session.location}</small>
                </div>
                <div className={styles.occupancy}><span><b>{session.bookedCount}</b>/{session.capacity} in</span><i><b style={{ width: `${percentage(session.bookedCount, session.capacity)}%` }} /></i></div>
              </Link>
            ))}</div> : <div className={styles.empty}>No sessions are scheduled today.</div>}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><h2>Who&apos;s busy right now</h2><Link href="/admin/coaches" className={styles.textButton}>Availability <ArrowRight size={14} /></Link></header>
            {data.coaches.length ? <div className={styles.coachList}>{data.coaches.map((coach) => (
              <article key={coach.id}>
                <span className={styles.avatar}>{coach.initials}</span>
                <span><strong>{coach.fullName}</strong><small>{coach.specialization}</small></span>
                <p>{coach.detail}</p><b data-status={coach.status}>{coach.status}</b>
              </article>
            ))}</div> : <div className={styles.empty}>No coach sessions are scheduled today.</div>}
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={`${styles.panel} ${styles.trialsPanel}`}>
            <header className={styles.panelHeader}><h2>Trials to close</h2><span>Decide & convert</span></header>
            {data.trials.length ? data.trials.map((trial) => (
              <article className={styles.compactPerson} key={trial.id}><span className={styles.avatar}>{trial.initials}</span><span><strong>{trial.fullName}</strong><small>{trial.groupName} · {trial.phone}</small></span><Link href="/admin/join-requests">Open</Link></article>
            )) : <div className={styles.empty}>No completed lead trials.</div>}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><h2>Renew this week</h2><Link href="/admin/subscriptions" className={styles.textButton}>All <ArrowRight size={14} /></Link></header>
            {data.renewals.length ? data.renewals.map((renewal) => (
              <article className={styles.compactPerson} key={renewal.id}><span className={styles.avatar}>{renewal.initials}</span><span><strong>{renewal.fullName}</strong><small>{renewal.planName} · {renewal.amountLabel}</small></span><b>{renewal.dueLabel}</b></article>
            )) : <div className={styles.empty}>No renewals in the next seven days.</div>}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><h2>Cash today</h2><Link href="/admin/subscriptions" className={styles.textButton}>Cash flow <ArrowRight size={14} /></Link></header>
            <div className={styles.cashTotal}><span><CircleDollarSign size={16} /> Cash in</span><strong>{data.cashTodayLabel}</strong></div>
            {data.recentPayments.length ? <div className={styles.paymentList}>{data.recentPayments.map((payment) => (
              <article key={payment.id}><span><strong>{payment.description}</strong><small>{payment.timeLabel}</small></span><b>{payment.amountLabel}</b></article>
            ))}</div> : <div className={styles.empty}>No payments recorded today.</div>}
            <AdminCashOutDialog />
          </section>
        </aside>
      </div>
    </div>
  );
}
