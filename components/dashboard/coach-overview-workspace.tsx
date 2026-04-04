import Link from "next/link";
import { ArrowRight, Clock3, NotebookPen } from "lucide-react";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { coachOverviewData } from "@/lib/mocks/coach-overview";

function getCoachSessionTone(status: "Ready" | "Waitlist" | "Prep") {
  switch (status) {
    case "Ready":
      return "success";
    case "Waitlist":
      return "warning";
    default:
      return "accent";
  }
}

export function CoachOverviewWorkspace() {
  const readySessions = coachOverviewData.upcomingSessions.filter(
    (session) => session.status === "Ready"
  ).length;
  const attentionClients = coachOverviewData.clientSpotlights.filter(
    (client) => client.momentum === "Needs check-in"
  ).length;

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Coach focus"
        actions={
          <>
            <Link href="/coach/clients" className="mv-btn mv-btn-secondary">
              <NotebookPen size={16} />
              Log Progress Note
            </Link>
            <Link href="/coach/schedule" className="mv-btn mv-btn-primary">
              <Clock3 size={16} />
              Review Today
            </Link>
          </>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Overview"
        title="Your next sessions, roster, and today&apos;s actions stay in one place."
        description="Use this page as a quick read before you open deeper views."
        items={[
          `${readySessions} ready sessions.`,
          `${attentionClients} client needs attention.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach overview highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Ready sessions</span>
          <strong>{readySessions}</strong>
          <p>Ready to run.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Clients needing attention</span>
          <strong>{attentionClients}</strong>
          <p>Need follow-up.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Today&apos;s plan</span>
          <strong>{coachOverviewData.todaysPlan.length} steps</strong>
          <p>Today&apos;s plan.</p>
        </article>
      </section>

      <section className="dashboard-kpi-grid" aria-label="Coach overview stats">
        {coachOverviewData.stats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="dashboard-overview-grid">
        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Up next</div>
              <h2>Your upcoming sessions</h2>
              <p>Your next sessions only.</p>
            </div>
          </div>

          <div className="dashboard-session-list">
            {coachOverviewData.upcomingSessions.map((session) => (
              <article key={session.id} className="dashboard-session-card">
                <div className="dashboard-session-card__meta">
                  <span
                    className={`dashboard-badge ${
                      getCoachSessionTone(session.status) === "success"
                        ? "dashboard-badge--success"
                        : getCoachSessionTone(session.status) === "warning"
                          ? "dashboard-badge--warning"
                          : "dashboard-badge--accent"
                    }`}
                  >
                    {session.status}
                  </span>
                  <span className="dashboard-session-card__time">
                    {session.dayLabel} - {session.timeLabel}
                  </span>
                </div>
                <h3 className="dashboard-session-card__name">{session.title}</h3>
                <p className="dashboard-session-card__detail">
                  {session.sessionType} - {session.location}
                </p>
                <div className="dashboard-session-card__footer">
                  <span className="dashboard-badge">{session.occupancyLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Today&apos;s movement</div>
              <h2>Recent activity</h2>
              <p>Updates that affect the day.</p>
            </div>
          </div>
          <DashboardActivityFeed items={coachOverviewData.recentActivity} />
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Assigned clients</div>
              <h2>Roster snapshot</h2>
              <p>Clients most likely to need attention.</p>
            </div>
          </div>

          <div className="dashboard-snapshot-list">
            {coachOverviewData.clientSpotlights.map((client) => (
              <article key={client.id} className="dashboard-snapshot-item">
                <span className="dashboard-badge">{client.momentum}</span>
                <strong>{client.fullName}</strong>
                <p>{client.focus}</p>
                <p>{client.nextSession}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Coach shortcuts</div>
              <h2>Quick actions and today&apos;s plan</h2>
              <p>Quick actions and plan for today.</p>
            </div>
          </div>

          <div className="dashboard-quick-grid">
            {coachOverviewData.quickActions.map((action) => {
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
                  <Link href={action.href} className="mv-btn mv-btn-outline">
                    {action.ctaLabel}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="dashboard-summary-list">
            {coachOverviewData.todaysPlan.map((item) => (
              <div key={item.id} className="dashboard-summary-row">
                <strong>
                  {item.timeLabel} - {item.title}
                </strong>
                <span>{item.note}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-info-strip">
            <strong>Daily workflow</strong>
            <p>Assigned workload and notes appear here.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
