import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Plus,
  Radio,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  AdminOverviewStat,
  AdminUpcomingSession,
} from "@/lib/mocks/admin-overview";
import { adminOverviewRepository } from "@/lib/repositories/admin-overview-repository";

import styles from "./page.module.css";

export const metadata = {
  title: "Admin Dashboard",
};

const metricTone = {
  accent: "brand",
  success: "success",
  warning: "warning",
  neutral: "neutral",
} as const satisfies Record<
  AdminOverviewStat["tone"],
  "brand" | "success" | "warning" | "neutral"
>;

function getSessionTone(status: AdminUpcomingSession["status"]) {
  switch (status) {
    case "On track":
      return "success" as const;
    case "Waitlist forming":
      return "warning" as const;
    case "Needs follow-up":
      return "critical" as const;
  }
}

function getActivityTone(tone: "success" | "warning" | "neutral") {
  return tone === "success" ? styles.activityDotSuccess :
    tone === "warning" ? styles.activityDotWarning : styles.activityDotNeutral;
}

export default async function AdminOverviewPage() {
  const { stats, upcomingSessions, recentActivity, quickActions, studioSnapshot } =
    await adminOverviewRepository.getOverview();

  const capacityAlerts = upcomingSessions.filter(
    (session) => session.status === "Waitlist forming",
  ).length;
  const followUpCount = upcomingSessions.filter(
    (session) => session.status === "Needs follow-up",
  ).length;
  const priorityLabel = capacityAlerts > 0
    ? `${capacityAlerts} session${capacityAlerts === 1 ? " is" : "s are"} approaching capacity.`
    : followUpCount > 0
      ? `${followUpCount} session${followUpCount === 1 ? " needs" : "s need"} follow-up.`
      : "The next 48 hours are operationally on track.";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingCopy}>
          <div className={styles.eyebrow}>
            <Radio size={15} aria-hidden="true" />
            Overview
          </div>
          <div className={styles.titleRow}>
            <h1>Dashboard Summary</h1>
            <StatusBadge tone="success">Live</StatusBadge>
          </div>
          <p>Studio performance, member activity, and the next operational priorities.</p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/notifications" className="mv-btn mv-btn-secondary">
            <Bell size={16} />
            View alerts
          </Link>
          <Link href="/admin/clients" className="mv-btn mv-btn-primary">
            <Plus size={16} />
            Add client
          </Link>
        </div>
      </header>

      <section className={styles.metrics} aria-label="Key studio metrics">
        {stats.map((stat) => (
          <MetricCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            detail={stat.detail}
            icon={stat.icon}
            tone={metricTone[stat.tone]}
          />
        ))}
      </section>

      <section className={styles.priority} aria-label="Current studio priority">
        <span className={styles.priorityIcon} aria-hidden="true">
          <Radio size={17} />
        </span>
        <div>
          <strong>Studio pulse</strong>
          <p>{priorityLabel}</p>
        </div>
        <Link href="/admin/sessions">
          Open schedule <ArrowRight size={15} />
        </Link>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby="upcoming-sessions-title">
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <IconChip icon={CalendarDays} tone="success" />
              <div>
                <h2 id="upcoming-sessions-title">Upcoming sessions</h2>
                <p>Today and tomorrow · live schedule</p>
              </div>
            </div>
            <Link href="/admin/sessions" className={styles.textLink}>
              All sessions <ArrowRight size={14} />
            </Link>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className={styles.sessionList}>
              {upcomingSessions.map((session) => {
                const occupancy = session.capacity > 0
                  ? Math.min(100, Math.round((session.bookedSeats / session.capacity) * 100))
                  : 0;

                return (
                  <article className={styles.sessionRow} key={session.id}>
                    <div className={styles.sessionTime}>
                      <span>{session.dayLabel}</span>
                      <strong>{session.timeLabel}</strong>
                    </div>
                    <div className={styles.sessionDivider} aria-hidden="true" />
                    <div className={styles.sessionBody}>
                      <div className={styles.sessionCopy}>
                        <strong>{session.name}</strong>
                        <p>{session.coachName} · {session.location}</p>
                      </div>
                      <div className={styles.sessionMeta}>
                        <StatusBadge>{session.sessionType}</StatusBadge>
                        <StatusBadge tone={getSessionTone(session.status)}>
                          {session.status}
                        </StatusBadge>
                      </div>
                      {session.sessionType === "Group" ? (
                        <div className={styles.occupancy}>
                          <div className={styles.occupancyCopy}>
                            <span>{session.bookedSeats} / {session.capacity} booked</span>
                            <strong>{occupancy}%</strong>
                          </div>
                          <div className={styles.progress} aria-hidden="true">
                            <span style={{ width: `${occupancy}%` }} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No sessions in the next 48 hours"
              description="Create or schedule the next studio session from the sessions workspace."
              icon={CalendarDays}
              action={
                <Link href="/admin/sessions" className="mv-btn mv-btn-secondary">
                  Open sessions
                </Link>
              }
            />
          )}
        </section>

        <aside className={styles.sideStack} aria-label="Admin activity and actions">
          <section className={styles.panel} aria-labelledby="recent-activity-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="recent-activity-title">Recent activity</h2>
                <p>Leads, payments, and coaching notes</p>
              </div>
            </div>
            {recentActivity.length > 0 ? (
              <ol className={styles.activityList}>
                {recentActivity.map((item) => (
                  <li key={item.id}>
                    <span className={`${styles.activityDot} ${getActivityTone(item.tone)}`} aria-hidden="true" />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <time>{item.timeLabel}</time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.panelEmpty}>New studio activity will appear here.</p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="quick-actions-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="quick-actions-title">Quick actions</h2>
                <p>Continue with the most common admin tasks</p>
              </div>
            </div>
            <div className={styles.actionList}>
              {quickActions.map((action) => (
                <Link href={action.href} className={styles.actionRow} key={action.id}>
                  <IconChip
                    icon={action.icon}
                    tone={action.emphasis === "primary" ? "brand" : "neutral"}
                  />
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className={styles.snapshot} aria-labelledby="studio-snapshot-title">
        <div className={styles.snapshotHeader}>
          <div>
            <span className={styles.eyebrow}>Studio snapshot</span>
            <h2 id="studio-snapshot-title">Right now</h2>
          </div>
          <span>Live operational signals</span>
        </div>
        <div className={styles.snapshotGrid}>
          {studioSnapshot.map((item) => (
            <article key={item.id}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
