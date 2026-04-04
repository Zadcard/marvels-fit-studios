import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CirclePlus,
  ClipboardList,
  UserPlus,
} from "lucide-react";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { adminOverviewData } from "@/lib/mocks/admin-overview";

export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminOverviewPage() {
  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Studio command center"
        actions={
          <>
            <Link href="/admin/sessions" className="mv-btn mv-btn-secondary">
              <CirclePlus size={16} />
              Create Session
            </Link>
            <Link href="/admin/clients" className="mv-btn mv-btn-primary">
              <UserPlus size={16} />
              Add Client
            </Link>
          </>
        }
      />

      <section className="dashboard-kpi-grid" aria-label="Admin overview stats">
        {adminOverviewData.stats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section
        className="dashboard-overview-grid"
        aria-label="Upcoming sessions and recent activity"
      >
        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Next 48 hours</div>
              <h2>Upcoming sessions</h2>
              <p>Upcoming sessions with coach and occupancy context.</p>
            </div>
            <span className="dashboard-badge dashboard-badge--accent">Preview</span>
          </div>

          <div className="dashboard-session-list">
            {adminOverviewData.upcomingSessions.map((session) => {
              const occupancy = Math.round(
                (session.bookedSeats / session.capacity) * 100
              );

              return (
                <article key={session.id} className="dashboard-session-card">
                  <div className="dashboard-session-card__meta">
                    <span className="dashboard-badge dashboard-badge--warning">
                      {session.sessionType}
                    </span>
                    <span className="dashboard-session-card__time">
                      {session.dayLabel} - {session.timeLabel}
                    </span>
                  </div>

                  <h3 className="dashboard-session-card__name">{session.name}</h3>
                  <p className="dashboard-session-card__detail">
                    Coach {session.coachName} - {session.location}
                  </p>

                  <div className="dashboard-session-card__footer">
                    <div className="dashboard-panel__header">
                      <span className="dashboard-badge dashboard-badge--success">
                        {session.status}
                      </span>
                      <span className="dashboard-badge">
                        {session.bookedSeats}/{session.capacity} booked
                      </span>
                    </div>
                    <div className="dashboard-progress" aria-hidden="true">
                      <span style={{ width: `${occupancy}%` }} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Today&apos;s movement</div>
              <h2>Recent activity</h2>
              <p>Key member, coach, and schedule updates.</p>
            </div>
            <CalendarClock size={20} color="#ff8b8f" />
          </div>

          <DashboardActivityFeed items={adminOverviewData.recentActivity} />
        </article>
      </section>

      <section
        className="dashboard-secondary-grid"
        aria-label="Quick actions and studio status"
      >
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Operational shortcuts</div>
              <h2>Quick actions</h2>
              <p>Common front-desk and scheduling actions.</p>
            </div>
            <ClipboardList size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-quick-grid">
            {adminOverviewData.quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <div key={action.id} className="dashboard-quick-card">
                  <span className="dashboard-quick-card__icon">
                    <Icon size={20} />
                  </span>
                  <div>
                    <strong>{action.label}</strong>
                    <p>{action.description}</p>
                  </div>
                  <Link
                    href={action.href}
                    className={
                      action.emphasis === "primary"
                        ? "mv-btn mv-btn-primary"
                        : "mv-btn mv-btn-outline"
                    }
                  >
                    {action.ctaLabel}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Studio snapshot</div>
              <h2>Health of the week</h2>
              <p>Attendance, onboarding, and plan demand at a glance.</p>
            </div>
            <CirclePlus size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-snapshot-list">
            {adminOverviewData.studioSnapshot.map((item) => (
              <article key={item.id} className="dashboard-snapshot-item">
                <span className="dashboard-badge">{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
