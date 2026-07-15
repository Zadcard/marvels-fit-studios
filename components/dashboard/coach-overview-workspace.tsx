import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  NotebookPen,
  UsersRound,
  Zap,
} from "lucide-react";

import type { CoachOverviewData } from "@/lib/dashboard/coach-overview-data";
import styles from "./coach-overview-workspace.module.css";

type CoachOverviewWorkspaceProps = {
  data: CoachOverviewData;
};

function sessionTone(status: string) {
  if (status === "Ready") return styles.ready;
  if (status === "Waitlist") return styles.warning;
  if (status === "Completed") return styles.complete;
  return styles.prep;
}

function activityIcon(tone: string) {
  if (tone === "warning") return <AlertTriangle size={16} />;
  if (tone === "success") return <CheckCircle2 size={16} />;
  return <Activity size={16} />;
}

export function CoachOverviewWorkspace({ data }: CoachOverviewWorkspaceProps) {
  const readySessions = data.upcomingSessions.filter(
    (session) => session.status === "Ready",
  ).length;
  const attentionClients = data.clientSpotlights.filter(
    (client) => client.momentum === "Needs check-in",
  ).length;
  const nextSession = data.upcomingSessions[0];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Coach command board</span>
          <h1>Own the next rep.</h1>
          <p>
            A live read of the floor, your athletes and the decisions that keep
            every session moving.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/coach/clients" className="mv-btn mv-btn-secondary">
            <NotebookPen size={17} /> Log progress
          </Link>
          <Link href="/coach/schedule" className="mv-btn mv-btn-primary">
            <CalendarDays size={17} /> Open schedule
          </Link>
        </div>
      </header>

      <section className={styles.scoreboard} aria-label="Coach live metrics">
        {data.stats.map((stat, index) => (
          <article key={stat.id} data-dark={index === 3 || undefined}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.change}</small>
          </article>
        ))}
      </section>

      <section className={styles.commandGrid}>
        <article className={styles.nextBlock}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Next on the floor</span>
              <h2>{nextSession ? "Session launch" : "Floor is clear"}</h2>
            </div>
            <Link href="/coach/sessions" aria-label="Open all coach sessions">
              <ArrowUpRight size={19} />
            </Link>
          </div>

          {nextSession ? (
            <div className={styles.nextSession}>
              <div className={styles.sessionTime}>
                <Clock3 size={18} />
                <strong>{nextSession.timeLabel}</strong>
                <span>{nextSession.dayLabel}</span>
              </div>
              <div className={styles.sessionIdentity}>
                <span
                  className={`${styles.status} ${sessionTone(nextSession.status)}`}
                >
                  {nextSession.status}
                </span>
                <h3>{nextSession.title}</h3>
                <p>
                  {nextSession.sessionType} session ·{" "}
                  {nextSession.occupancyLabel}
                </p>
              </div>
              <div className={styles.location}>
                <MapPin size={17} />
                <span>{nextSession.location}</span>
              </div>
              <Link href="/coach/sessions" className={styles.launchLink}>
                Run session <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className={styles.empty}>
              <CheckCircle2 size={27} />
              <strong>No upcoming session</strong>
              <span>Your assigned sessions will appear here.</span>
            </div>
          )}

          <div className={styles.queue}>
            <div className={styles.queueLabel}>
              <span>Coming up</span>
              <strong>{data.upcomingSessions.length} blocks</strong>
            </div>
            {data.upcomingSessions.slice(1).map((session) => (
              <Link href="/coach/sessions" key={session.id}>
                <time>{session.timeLabel}</time>
                <div>
                  <strong>{session.title}</strong>
                  <small>{session.location}</small>
                </div>
                <span
                  className={`${styles.status} ${sessionTone(session.status)}`}
                >
                  {session.status}
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </article>

        <aside className={styles.readiness}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Readiness signal</span>
              <h2>Today at a glance</h2>
            </div>
            <Zap size={20} />
          </div>
          <div className={styles.signal}>
            <strong>{readySessions}</strong>
            <span>sessions ready to run</span>
          </div>
          <div className={styles.signalTrack}>
            <i
              style={{
                width: `${Math.min(100, (readySessions / Math.max(1, data.upcomingSessions.length)) * 100)}%`,
              }}
            />
          </div>
          <dl>
            <div>
              <dt>Client alerts</dt>
              <dd>{attentionClients}</dd>
            </div>
            <div>
              <dt>Plan checkpoints</dt>
              <dd>{data.todaysPlan.length}</dd>
            </div>
          </dl>
          <Link href="/coach/schedule">
            Review the full day <ArrowRight size={16} />
          </Link>
        </aside>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.roster}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Athlete pulse</span>
              <h2>Who needs your eye</h2>
            </div>
            <Link href="/coach/clients">
              All clients <ArrowRight size={15} />
            </Link>
          </div>
          {data.clientSpotlights.length ? (
            <div className={styles.clientList}>
              {data.clientSpotlights.map((client) => (
                <Link href="/coach/clients" key={client.id}>
                  <span className={styles.avatar}>
                    {client.fullName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{client.fullName}</strong>
                    <small>{client.focus}</small>
                  </div>
                  <div className={styles.clientNext}>
                    <span>{client.momentum}</span>
                    <small>{client.nextSession}</small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <UsersRound size={27} />
              <strong>No assigned clients yet</strong>
              <span>New assignments will appear automatically.</span>
            </div>
          )}
        </article>

        <article className={styles.timeline}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Live timeline</span>
              <h2>What changed</h2>
            </div>
            <Activity size={20} />
          </div>
          {data.recentActivity.length ? (
            <ol>
              {data.recentActivity.map((item) => (
                <li key={item.id} data-tone={item.tone}>
                  <span>{activityIcon(item.tone)}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <small>{item.timeLabel}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.empty}>
              <Activity size={27} />
              <strong>No activity yet</strong>
              <span>Live coaching updates will collect here.</span>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
