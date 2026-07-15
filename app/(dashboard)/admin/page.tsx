import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Plus,
  Radio,
  Users,
} from "lucide-react";

import { adminOverviewRepository } from "@/lib/repositories/admin-overview-repository";
import styles from "./page.module.css";

export const metadata = { title: "Studio Operations" };

function sessionTone(status: string) {
  if (status === "On track") return styles.good;
  if (status === "Waitlist forming") return styles.warning;
  return styles.danger;
}

export default async function AdminOverviewPage() {
  const { stats, upcomingSessions, recentActivity, quickActions, studioSnapshot } =
    await adminOverviewRepository.getOverview();
  const memberStat = stats.find((item) => item.id === "members") ?? stats[0];
  const booked = upcomingSessions.reduce((total, item) => total + item.bookedSeats, 0);
  const capacity = upcomingSessions.reduce((total, item) => total + item.capacity, 0);
  const utilization = capacity ? Math.round((booked / capacity) * 100) : 0;
  const pressure = upcomingSessions.filter((item) => item.status !== "On track").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.kicker}><Radio size={14} /> Live studio desk</span>
          <h1>Control the floor.</h1>
          <p>Membership, capacity, money and the next sessions—one operating view.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/notifications" className="mv-btn mv-btn-secondary"><Bell size={17} /> Alerts</Link>
          <Link href="/admin/sessions" className="mv-btn mv-btn-primary"><Plus size={17} /> New session</Link>
        </div>
      </header>

      <section className={styles.commandGrid} aria-label="Studio control summary">
        <article className={`${styles.block} ${styles.heroMetric}`}>
          <div className={styles.blockTop}>
            <span>Active membership</span>
            <Link href="/admin/clients" aria-label="Open client directory"><ArrowUpRight size={18} /></Link>
          </div>
          <div className={styles.heroValue}>{memberStat?.value ?? "0"}</div>
          <p>{memberStat?.change ?? "Roster is live"}</p>
          <div className={styles.tickTrack} aria-hidden="true">
            {Array.from({ length: 28 }, (_, index) => <i key={index} data-on={index < 19 || undefined} />)}
          </div>
          <div className={styles.insight}><Users size={15} /><span><strong>Roster signal</strong>{memberStat?.detail}</span></div>
        </article>

        {stats.filter((item) => item.id !== "members").map((stat) => {
          const Icon = stat.icon;
          return (
            <article className={`${styles.block} ${styles.smallMetric}`} key={stat.id}>
              <div className={styles.blockTop}><span>{stat.label}</span><Icon size={18} /></div>
              <strong>{stat.value}</strong>
              <p>{stat.change}</p>
              <span className={styles.metricNote}>{stat.note}</span>
            </article>
          );
        })}

        <article className={`${styles.block} ${styles.capacity}`}>
          <div className={styles.blockTop}><span>48 hour capacity</span><CalendarDays size={18} /></div>
          <div className={styles.capacityValue}><strong>{utilization}%</strong><span>booked</span></div>
          <div className={styles.capacityBar}><span style={{ width: `${utilization}%` }} /></div>
          <div className={styles.capacityLegend}><span>{booked} reservations</span><span>{capacity} places</span></div>
        </article>

        <article className={`${styles.block} ${styles.alertBlock}`}>
          <div className={styles.blockTop}><span>Unresolved pressure</span><CircleAlert size={18} /></div>
          <div className={styles.alertValue}>{pressure}<span>items</span></div>
          <p>{pressure ? "Capacity or follow-up needs a decision." : "The next sessions are clear."}</p>
          <Link href="/admin/sessions">Review operations <ChevronRight size={15} /></Link>
        </article>
      </section>

      <section className={styles.lowerGrid}>
        <article className={`${styles.block} ${styles.schedule}`}>
          <div className={styles.sectionHeading}>
            <div><span>Next on the floor</span><h2>Session runway</h2></div>
            <Link href="/admin/schedule">Full calendar <ArrowUpRight size={16} /></Link>
          </div>
          <div className={styles.sessionList}>
            {upcomingSessions.length ? upcomingSessions.map((session) => {
              const fill = session.capacity ? Math.round((session.bookedSeats / session.capacity) * 100) : 0;
              return (
                <Link href="/admin/sessions" className={styles.session} key={session.id}>
                  <time><span>{session.dayLabel}</span><strong>{session.timeLabel}</strong></time>
                  <div><strong>{session.name}</strong><p>{session.coachName} · {session.location}</p></div>
                  <div className={styles.sessionLoad}><span className={sessionTone(session.status)}>{session.status}</span><small>{fill}% full</small></div>
                  <ChevronRight size={17} />
                </Link>
              );
            }) : <div className={styles.empty}>No sessions in the next 48 hours.</div>}
          </div>
        </article>

        <aside className={`${styles.block} ${styles.activity}`}>
          <div className={styles.sectionHeading}><div><span>Right now</span><h2>Activity wire</h2></div></div>
          <ol>
            {recentActivity.slice(0, 5).map((item) => (
              <li key={item.id}><i data-tone={item.tone} /><div><strong>{item.title}</strong><p>{item.description}</p><time>{item.timeLabel}</time></div></li>
            ))}
          </ol>
        </aside>
      </section>

      <section className={styles.bottomGrid}>
        <div className={`${styles.block} ${styles.actions}`}>
          <div className={styles.sectionHeading}><div><span>Fast lane</span><h2>Move the studio</h2></div></div>
          <div className={styles.actionGrid}>{quickActions.map((action) => {
            const Icon = action.icon;
            return <Link href={action.href} key={action.id}><Icon size={18} /><span><strong>{action.label}</strong><small>{action.description}</small></span><ArrowUpRight size={16} /></Link>;
          })}</div>
        </div>
        <div className={`${styles.block} ${styles.snapshot}`}>
          <div className={styles.sectionHeading}><div><span>Studio signals</span><h2>Snapshot</h2></div></div>
          <div>{studioSnapshot.map((item) => <article key={item.id}><span>{item.label}</span><strong>{item.value}</strong><p>{item.description}</p></article>)}</div>
        </div>
      </section>
    </div>
  );
}
