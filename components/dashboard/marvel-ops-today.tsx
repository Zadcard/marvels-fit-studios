"use client";

import { ArrowRight, CircleDollarSign, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import type { AdminTodayOperations } from "@/lib/dashboard/admin-today-operations";
import { STUDIO_TIME_ZONE } from "@/lib/time/studio-time";
import { AdminCashOutDialog } from "./admin-cash-out-dialog";
import styles from "./marvel-ops-today.module.css";

const tones = ["red", "green", "violet", "blue", "amber"] as const;

export function MarvelOpsToday({ data }: { data: AdminTodayOperations }) {
  const router = useRouter();
  const openAttendance = (id: string) =>
    router.push(`/admin/attendance?session=${encodeURIComponent(id)}`);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return <div className={styles.page}>
    <section className={styles.metrics} aria-label="Today at a glance">
      <article><span>On floor now</span><strong>{data.liveCount}<small>live</small></strong><p>{data.coaches.find((coach) => coach.status === "On floor")?.fullName ?? "No live session"}</p></article>
      <article><span>Coming today</span><strong>{data.sessions.length}</strong><p>{data.expectedClients} {data.expectedClients === 1 ? "client" : "clients"} expected</p></article>
      <article data-tone="danger"><span>Trials to close</span><strong>{data.trials.length}</strong><p>Need an outcome</p></article>
      <article data-tone="warning"><span>Renew this week</span><strong>{data.renewals.length}</strong><p>Follow up before expiry</p></article>
      <article data-tone="success"><span>Cash today</span><strong>{data.cashTodayLabel}</strong><p>{data.cashTodayCount} {data.cashTodayCount === 1 ? "payment" : "payments"} in</p></article>
    </section>

    <div className={styles.grid}>
      <div className={styles.primary}>
        <section className={styles.panel}>
          <header><div><span>OPERATIONS</span><h2>Today&apos;s floor</h2><p>{dateLabel}</p></div><button type="button" onClick={() => router.push("/admin/schedule")}>Full schedule <ArrowRight size={15} /></button></header>
          <div className={styles.sessionList}>
            {data.sessions.map((session, index) => <button type="button" key={session.id} className={styles.session} data-live={session.isLive || undefined} onClick={() => openAttendance(session.id)}>
              <time><strong>{session.timeLabel}</strong><small>{session.isLive ? "Live now" : "Today"}</small></time>
              <span className={styles.sessionTitle}><i data-tone={tones[index % tones.length]}>{session.coachInitials}</i><b>{session.title}<small>{session.coachName} · {session.location}</small></b></span>
              <span className={styles.occupancy}><strong>{session.bookedCount}/{session.capacity}</strong><small>checked in</small></span><ArrowRight size={15} />
            </button>)}
            {!data.sessions.length ? <p className={styles.panelEmpty}>No sessions scheduled today.</p> : null}
          </div>
        </section>

        <section className={styles.panel}>
          <header><div><span>CAPACITY</span><h2>Who&apos;s busy right now</h2></div><button type="button" onClick={() => router.push("/admin/coaches")}>Availability <ArrowRight size={15} /></button></header>
          <div className={styles.coaches}>{data.coaches.map((coach, index) => <button type="button" key={coach.id} onClick={() => router.push("/admin/coaches")}><i data-tone={tones[index % tones.length]}>{coach.initials}</i><span><b>{coach.fullName}</b><small>{coach.specialization}</small></span><em>{coach.detail}</em></button>)}{!data.coaches.length ? <p className={styles.panelEmpty}>No coaches on the floor right now.</p> : null}</div>
        </section>
      </div>

      <aside className={styles.aside}>
        <section className={styles.panel}><header><div><span>LEADS</span><h2>Trials to close</h2></div><button type="button" onClick={() => router.push("/admin/join-requests")}>Open <ArrowRight size={15} /></button></header>{data.trials.map((trial, index) => <button className={styles.person} type="button" key={trial.id} onClick={() => router.push("/admin/join-requests")}><i data-tone={tones[index % tones.length]}>{trial.initials}</i><span><b>{trial.fullName}</b><small>{trial.groupName}</small></span><ArrowRight size={14} /></button>)}{!data.trials.length ? <p className={styles.panelEmpty}>No trials to close.</p> : null}</section>
        <section className={styles.panel}><header><div><span>MONEY</span><h2>Renew this week</h2></div><button type="button" onClick={() => router.push("/admin/subscriptions")}>All <ArrowRight size={15} /></button></header>{data.renewals.map((renewal, index) => <button className={styles.person} type="button" key={renewal.id} onClick={() => router.push("/admin/subscriptions")}><i data-tone={tones[index % tones.length]}>{renewal.initials}</i><span><b>{renewal.fullName}</b><small>{renewal.planName} · {renewal.amountLabel}{renewal.methodLabel ? ` · Paid by ${renewal.methodLabel}` : ""}</small></span><em>{renewal.dueLabel}</em></button>)}{!data.renewals.length ? <p className={styles.panelEmpty}>No renewals this week.</p> : null}</section>
        <section className={styles.cash}><header><div><span><CircleDollarSign size={14} /> CASH TODAY</span><h2>{data.cashTodayLabel}</h2></div><button type="button" onClick={() => router.push("/admin/reports")}>Cash flow <ArrowRight size={15} /></button></header><p><Users size={14} /> {data.cashTodayCount} {data.cashTodayCount === 1 ? "payment" : "payments"} recorded</p><AdminCashOutDialog /></section>
      </aside>
    </div>
  </div>;
}
