import Link from "next/link";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { adminOverviewRepository } from "@/lib/repositories/admin-overview-repository";

export const metadata = {
  title: "Admin Dashboard",
};

function getSessionStatusTone(status: string) {
  switch (status) {
    case "On track":
      return "success";
    case "Waitlist forming":
      return "warning";
    case "Needs follow-up":
      return "accent";
    default:
      return "neutral";
  }
}

export default async function AdminOverviewPage() {
  const { stats, upcomingSessions, recentActivity, quickActions, studioSnapshot } =
    await adminOverviewRepository.getOverview();

  const atCapacity = upcomingSessions.filter((s) => s.status === "Waitlist forming").length;
  const needsFollowUp = upcomingSessions.filter((s) => s.status === "Needs follow-up").length;

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin operations"
        actions={
          <>
            <Link href="/admin/sessions" className="mv-btn mv-btn-secondary">
              View sessions
            </Link>
            <Link href="/admin/clients" className="mv-btn mv-btn-primary">
              Add Client
            </Link>
          </>
        }
      />

      <section className="dashboard-kpi-grid" aria-label="Key metrics">
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            detail={stat.detail}
            note={stat.note}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </section>

      <DashboardSurfaceNote
        eyebrow="Studio pulse"
        title={
          atCapacity > 0
            ? `${atCapacity} upcoming session${atCapacity === 1 ? "" : "s"} ${atCapacity === 1 ? "is" : "are"} filling up — check capacity before the day starts.`
            : needsFollowUp > 0
              ? `${needsFollowUp} session${needsFollowUp === 1 ? "" : "s"} still need follow-up before they fill.`
              : "Sessions are on track — focus on billing follow-up and coach coverage."
        }
        description="Use this board to move through sessions, clear billing pressure, and handle incoming requests without leaving the admin workspace."
        items={[
          `${upcomingSessions.length} sessions scheduled in the next 48 hours.`,
          `${recentActivity.length} recent activity items across leads, payments, and notes.`,
          `${quickActions.length} recommended actions based on current studio state.`,
        ]}
      />

      <section className="dashboard-overview-grid dashboard-overview-grid--admin">
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Upcoming</div>
              <h2>Sessions today &amp; tomorrow</h2>
              <p>Live schedule view. Open a session to manage it.</p>
            </div>
            <Link href="/admin/sessions" className="mv-btn mv-btn-outline">
              All sessions
            </Link>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="dashboard-session-list">
              {upcomingSessions.map((session) => {
                const fill =
                  session.capacity > 0
                    ? Math.round((session.bookedSeats / session.capacity) * 100)
                    : 0;
                return (
                  <article
                    key={session.id}
                    className="dashboard-session-card dashboard-session-card--admin"
                  >
                    <div className="dashboard-session-card__topline">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="dashboard-session-card__meta" style={{ marginBottom: 8 }}>
                          <DashboardStatusBadge
                            label={session.sessionType}
                            tone={session.sessionType === "Private" ? "accent" : "neutral"}
                          />
                          <DashboardStatusBadge
                            label={session.status}
                            tone={getSessionStatusTone(session.status)}
                          />
                        </div>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "1rem",
                            letterSpacing: "-0.01em",
                            color: "#fff",
                          }}
                        >
                          {session.name}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "rgba(255,255,255,0.55)",
                            marginTop: 2,
                            display: "block",
                          }}
                        >
                          {session.coachName} · {session.location}
                        </span>
                      </div>
                      <div className="dashboard-session-card__time-block">
                        <span>{session.dayLabel}</span>
                        <strong>{session.timeLabel}</strong>
                      </div>
                    </div>

                    {session.sessionType === "Group" && (
                      <div className="dashboard-session-card__footer dashboard-session-card__footer--admin">
                        <span className="dashboard-session-card__occupancy">
                          {session.bookedSeats} / {session.capacity}
                        </span>
                        <div className="dashboard-session-card__progress-block">
                          <div className="dashboard-session-card__progress-label">
                            {fill}% booked
                          </div>
                          <div className="dashboard-progress">
                            <span
                              style={{
                                width: `${fill}%`,
                                background:
                                  fill >= 100
                                    ? "var(--mv-warning)"
                                    : "linear-gradient(90deg, var(--mv-primary), #ff6b6f)",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>No sessions in the next 48 hours</strong>
              <p>Create or schedule sessions from the sessions workspace.</p>
              <div className="dashboard-empty-state__action">
                <Link href="/admin/sessions" className="mv-btn mv-btn-outline">
                  Open sessions
                </Link>
              </div>
            </div>
          )}
        </article>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <article className="dashboard-panel dashboard-panel--dense">
            <div className="dashboard-panel__header">
              <div>
                <div className="mv-eyebrow">Activity</div>
                <h2>Recent updates</h2>
              </div>
            </div>
            {recentActivity.length > 0 ? (
              <DashboardActivityFeed items={recentActivity} />
            ) : (
              <div className="dashboard-empty-state">
                <strong>No recent activity</strong>
                <p>Activity from leads, payments, and session notes will surface here.</p>
              </div>
            )}
          </article>

          <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
            <div className="dashboard-panel__header">
              <div>
                <div className="mv-eyebrow">Quick actions</div>
                <h2>Common tasks</h2>
              </div>
            </div>
            <div className="dashboard-admin-action-list">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    className={`dashboard-admin-action-row${action.emphasis === "primary" ? " dashboard-admin-action-row--primary" : ""}`}
                  >
                    <span className="dashboard-admin-action-row__icon" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <div className="dashboard-admin-action-row__content">
                      <strong>{action.label}</strong>
                      <p>{action.description}</p>
                    </div>
                    <div className="dashboard-admin-action-row__cta">
                      <Link
                        href={action.href}
                        className={
                          action.emphasis === "primary"
                            ? "mv-btn mv-btn-primary"
                            : "mv-btn mv-btn-outline"
                        }
                      >
                        {action.ctaLabel}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-panel dashboard-panel--dense">
        <div className="dashboard-panel__header dashboard-panel__header--tight">
          <div>
            <div className="mv-eyebrow">Studio snapshot</div>
            <h2>Right now</h2>
          </div>
        </div>
        <div className="dashboard-snapshot-list">
          {studioSnapshot.map((item) => (
            <div key={item.id} className="dashboard-snapshot-item">
              <span
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.48)",
                }}
              >
                {item.label}
              </span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
