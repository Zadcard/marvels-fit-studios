import type { CSSProperties } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarPlus2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import type { AdminOverviewData } from "@/lib/dashboard/admin-overview-data";

const dashboardDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function getSessionFill(bookedSeats: number, capacity: number) {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((bookedSeats / capacity) * 100));
}

export function AdminOverviewScreen({
  stats,
  upcomingSessions,
  recentActivity,
  quickActions,
  studioSnapshot,
}: AdminOverviewData) {
  const memberStat = stats.find((stat) => stat.id === "members") ?? stats[0];
  const revenueStat = stats.find((stat) => stat.id === "revenue") ?? stats.at(-1);
  const primaryAction =
    quickActions.find((action) => action.emphasis === "primary") ?? quickActions[0];
  const supportingAction = quickActions.find(
    (action) => action.id !== primaryAction?.id,
  );
  const groupSessions = upcomingSessions.filter(
    (session) => session.sessionType === "Group",
  );
  const totalCapacity = groupSessions.reduce(
    (total, session) => total + session.capacity,
    0,
  );
  const totalBooked = groupSessions.reduce(
    (total, session) => total + session.bookedSeats,
    0,
  );
  const occupancy = totalCapacity
    ? Math.min(100, Math.round((totalBooked / totalCapacity) * 100))
    : 0;

  return (
    <div className="admin-overview-screen">
      <aside className="admin-overview-summary" aria-labelledby="studio-summary-title">
        <header className="admin-overview-summary__header">
          <div>
            <p className="mv-eyebrow">Studio pulse</p>
            <h2 id="studio-summary-title">Today at the studio</h2>
          </div>
          <div className="admin-overview-icon-row" aria-label="Date navigation">
            <button className="mv-icon-btn" type="button" aria-label="Previous day">
              <ChevronLeft size={17} />
            </button>
            <button className="mv-icon-btn" type="button" aria-label="Next day">
              <ChevronRight size={17} />
            </button>
          </div>
        </header>

        <article className="admin-overview-featured">
          <span>{memberStat?.label ?? "Active members"}</span>
          <strong>{memberStat?.value ?? "0"}</strong>
          <small>
            <TrendingUp size={13} />
            {memberStat?.change ?? "Roster ready"}
          </small>
        </article>

        <div className="admin-overview-action-row">
          {primaryAction ? (
            <Link href={primaryAction.href} className="mv-btn mv-btn-primary">
              <primaryAction.icon size={15} />
              {primaryAction.ctaLabel}
            </Link>
          ) : null}
          {supportingAction ? (
            <Link href={supportingAction.href} className="mv-btn mv-btn-secondary">
              <supportingAction.icon size={15} />
              {supportingAction.ctaLabel}
            </Link>
          ) : null}
          <Link
            href="/admin/schedule"
            className="mv-icon-btn"
            aria-label="Open schedule"
          >
            <MoreHorizontal size={17} />
          </Link>
        </div>

        <section className="admin-overview-occupancy" aria-label="Current occupancy">
          <div className="admin-overview-occupancy__tabs" aria-hidden="true">
            <span>Occupancy</span>
            <span>Capacity</span>
          </div>
          <h3>Upcoming group occupancy</h3>
          <p>{totalBooked} of {totalCapacity || 0} available places booked</p>
          <div className="admin-overview-progress" aria-hidden="true">
            <span style={{ width: `${occupancy}%` }} />
          </div>
          <strong>{occupancy}%</strong>
        </section>

        <section className="admin-overview-signal-list" aria-labelledby="signals-title">
          <div className="admin-overview-section-title">
            <h3 id="signals-title">Studio signals</h3>
            <CalendarPlus2 size={16} aria-hidden="true" />
          </div>
          {studioSnapshot.slice(0, 3).map((item, index) => (
            <article key={item.id} className="admin-overview-signal-row">
              <span className={`admin-overview-signal-row__avatar admin-overview-signal-row__avatar--${index + 1}`}>
                {item.value.slice(0, 2)}
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
              <b>{item.value}</b>
            </article>
          ))}
        </section>
      </aside>

      <section className="admin-overview-main">
        <header className="admin-overview-main__header">
          <div>
            <p className="mv-eyebrow">Admin overview</p>
            <h1>{dashboardDateFormatter.format(new Date())}</h1>
            <p>Live priorities and studio performance.</p>
          </div>
          <div className="admin-overview-icon-row">
            <Link href="/admin/sessions" className="mv-icon-btn" aria-label="Create session">
              <CalendarPlus2 size={17} />
            </Link>
            <Link href="/admin/notifications" className="mv-icon-btn" aria-label="Open notifications">
              <Bell size={17} />
            </Link>
          </div>
        </header>

        <section className="dashboard-kpi-grid admin-overview-kpis" aria-label="Key metrics">
          {stats.map((stat) => (
            <DashboardStatCard key={stat.id} {...stat} />
          ))}
        </section>

        <section className="admin-overview-analytics-grid">
          <article className="dashboard-panel admin-overview-chart-panel">
            <header>
              <div>
                <span>Upcoming load</span>
                <h2>{totalBooked} bookings</h2>
              </div>
              <small>{occupancy}% filled</small>
            </header>
            {upcomingSessions.length ? (
              <div className="admin-overview-bars" aria-label="Upcoming session occupancy">
                {upcomingSessions.slice(0, 7).map((session, index) => {
                  const fill = getSessionFill(session.bookedSeats, session.capacity);
                  return (
                    <div key={session.id} className="admin-overview-bar-item">
                      <div className="admin-overview-bar-track">
                        <span
                          className={`admin-overview-bar admin-overview-bar--${(index % 4) + 1}`}
                          style={{ "--bar-level": `${Math.max(fill, 8)}%` } as CSSProperties}
                        />
                      </div>
                      <small>{session.dayLabel.slice(0, 2)}</small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="admin-overview-panel-empty">No upcoming sessions in the next 48 hours.</p>
            )}
          </article>

          <article className="dashboard-panel admin-overview-revenue-panel">
            <span>Revenue snapshot</span>
            <h2>{revenueStat?.value ?? "EGP 0"}</h2>
            <p>{revenueStat?.detail ?? "Payments captured this month."}</p>
            <div className="admin-overview-snapshot-grid">
              {studioSnapshot.slice(0, 4).map((item) => (
                <div key={item.id}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <article className="dashboard-panel admin-overview-activity-panel">
          <header className="admin-overview-section-title">
            <div>
              <span>Attendance and operations</span>
              <h2>Recent studio activity</h2>
            </div>
            <Link href="/admin/notifications" className="mv-btn mv-btn-outline">
              View all
            </Link>
          </header>
          {recentActivity.length ? (
            <DashboardActivityFeed items={recentActivity} />
          ) : (
            <p className="admin-overview-panel-empty">Activity will appear as the studio moves.</p>
          )}
        </article>
      </section>
    </div>
  );
}
