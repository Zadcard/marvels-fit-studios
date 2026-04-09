import Link from "next/link";
import {
  ArrowRight,
  CirclePlus,
  UserPlus,
} from "lucide-react";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { adminOverviewRepository } from "@/lib/repositories/admin-overview-repository";

export const metadata = {
  title: "Admin Dashboard",
};

function getSessionStatusTone(status: "On track" | "Waitlist forming" | "Needs follow-up") {
  switch (status) {
    case "On track":
      return "success";
    case "Waitlist forming":
      return "warning";
    default:
      return "accent";
  }
}

function getSessionTypeTone(type: "Group" | "Private") {
  return type === "Private" ? "neutral" : "warning";
}

function getSnapshotTone(label: string) {
  if (label === "Onboarding queue") {
    return "accent";
  }

  if (label === "Plan demand") {
    return "warning";
  }

  if (label === "Energy note") {
    return "success";
  }

  return "neutral";
}

function getSnapshotImplication(label: string) {
  if (label === "Onboarding queue") {
    return "Clear today";
  }

  if (label === "Plan demand") {
    return "Watch capacity";
  }

  if (label === "Energy note") {
    return "Attendance pace";
  }

  return "Next focus";
}

export default async function AdminOverviewPage() {
  const adminOverviewData = await adminOverviewRepository.getOverview();
  const onboardingQueue =
    adminOverviewData.studioSnapshot.find((item) => item.label === "Onboarding queue")
      ?.value ?? "0";
  const waitlistRiskCount = adminOverviewData.upcomingSessions.filter(
    (session) => session.status === "Waitlist forming"
  ).length;
  const followUpCount = adminOverviewData.upcomingSessions.filter(
    (session) => session.status === "Needs follow-up"
  ).length;
  const onboardingQueueCount = Number(onboardingQueue.replaceAll(",", ""));
  const watchCount = waitlistRiskCount + followUpCount;
  const priorityAction = adminOverviewData.quickActions.find(
    (action) => action.emphasis === "primary"
  );

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Admin overview"
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

      <DashboardSurfaceNote
        eyebrow="Admin briefing"
        title={
          onboardingQueueCount > 0
            ? `${onboardingQueue} leads need review before the next session block.`
            : "The lead queue is clear enough to focus on sessions and coverage."
        }
        description="Scan the queue, protect at-risk sessions, then move to coverage or billing."
        action={
          <DashboardStatusBadge
            label={watchCount > 0 ? `${watchCount} watch items` : "Operationally clear"}
            tone={watchCount > 0 ? "warning" : "success"}
          />
        }
        items={[
          `${adminOverviewData.upcomingSessions.length} sessions scheduled in the next 48 hours.`,
          `${followUpCount} sessions still need booking follow-up.`,
          `${adminOverviewData.recentActivity.length} recent changes landed since the last review.`,
        ]}
      />

      <section
        className="dashboard-mini-grid dashboard-admin-priority-grid"
        aria-label="Admin priorities"
      >
        <DashboardMiniStat
          tone={onboardingQueueCount > 0 ? "accent" : "success"}
          label="Lead queue"
          value={onboardingQueue}
          description="Leads waiting for contact or approval."
        />
        <DashboardMiniStat
          tone={waitlistRiskCount > 0 ? "warning" : "success"}
          label="Waitlist risk"
          value={waitlistRiskCount}
          description="Sessions that may need overflow handling."
        />
        <DashboardMiniStat
          tone={followUpCount > 0 ? "accent" : "success"}
          label="Booking follow-up"
          value={followUpCount}
          description="Sessions still missing early booking signal."
        />
      </section>

      <section className="dashboard-kpi-grid" aria-label="Admin overview stats">
        {adminOverviewData.stats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section
        className="dashboard-overview-grid dashboard-overview-grid--admin"
        aria-label="Upcoming sessions and recent activity"
      >
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Next 48 hours</div>
              <h2>Sessions needing visibility</h2>
              <p>Time, coach coverage, and booking signal in one pass.</p>
            </div>
            <DashboardStatusBadge
              label={`${adminOverviewData.upcomingSessions.length} scheduled`}
              tone="accent"
            />
          </div>

          <div className="dashboard-panel__meta-strip">
            <span>{waitlistRiskCount} waitlist risks</span>
            <span>{followUpCount} need follow-up</span>
          </div>

          {adminOverviewData.upcomingSessions.length > 0 ? (
            <div className="dashboard-session-list dashboard-session-list--dense">
              {adminOverviewData.upcomingSessions.map((session) => {
                const occupancy = Math.round(
                  (session.bookedSeats / session.capacity) * 100
                );

                return (
                  <article
                    key={session.id}
                    className="dashboard-session-card dashboard-session-card--admin"
                  >
                    <div className="dashboard-session-card__topline">
                      <div className="dashboard-session-card__meta">
                        <DashboardStatusBadge
                          label={session.sessionType}
                          tone={getSessionTypeTone(session.sessionType)}
                        />
                        <DashboardStatusBadge
                          label={session.status}
                          tone={getSessionStatusTone(session.status)}
                        />
                      </div>
                      <div className="dashboard-session-card__time-block">
                        <span>{session.dayLabel}</span>
                        <strong>{session.timeLabel}</strong>
                      </div>
                    </div>

                    <div className="dashboard-session-card__headline">
                      <h3 className="dashboard-session-card__name">{session.name}</h3>
                      <span className="dashboard-session-card__location">
                        {session.location}
                      </span>
                    </div>

                    <p className="dashboard-session-card__detail">
                      Coach {session.coachName}
                    </p>

                    <div className="dashboard-session-card__footer dashboard-session-card__footer--admin">
                      <span className="dashboard-session-card__occupancy">
                        {session.bookedSeats}/{session.capacity} booked
                      </span>
                      <div className="dashboard-session-card__progress-block">
                        <span className="dashboard-session-card__progress-label">
                          {occupancy}% full
                        </span>
                        <div className="dashboard-progress" aria-hidden="true">
                          <span style={{ width: `${occupancy}%` }} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <DashboardEmptyState
              title="No sessions need review in the next 48 hours."
              description="Create a session block or reopen the schedule when new capacity is needed."
              action={
                <Link href="/admin/sessions" className="mv-btn mv-btn-outline">
                  Open Sessions
                </Link>
              }
            />
          )}
        </article>

        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Today&apos;s movement</div>
              <h2>Recent activity</h2>
              <p>Roster, billing, and coaching changes worth noticing now.</p>
            </div>
            <DashboardStatusBadge
              label={`${adminOverviewData.recentActivity.length} items`}
            />
          </div>

          {adminOverviewData.recentActivity.length > 0 ? (
            <DashboardActivityFeed items={adminOverviewData.recentActivity} />
          ) : (
            <DashboardEmptyState
              title="No new operational changes yet."
              description="This feed updates when leads, payments, or session notes change."
            />
          )}
        </article>
      </section>

      <section
        className="dashboard-secondary-grid dashboard-secondary-grid--admin"
        aria-label="Quick actions and studio status"
      >
        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Operational shortcuts</div>
              <h2>Quick actions</h2>
              <p>Start with the priority action, then move through routine control work.</p>
            </div>
            <DashboardStatusBadge
              label={priorityAction ? "1 priority action" : "Actions ready"}
              tone="accent"
            />
          </div>

          <div className="dashboard-admin-action-list">
            {adminOverviewData.quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <div
                  key={action.id}
                  className={
                    action.emphasis === "primary"
                      ? "dashboard-admin-action-row dashboard-admin-action-row--primary"
                      : "dashboard-admin-action-row"
                  }
                >
                  <span className="dashboard-admin-action-row__icon">
                    <Icon size={20} />
                  </span>
                  <div className="dashboard-admin-action-row__content">
                    <span className="dashboard-admin-action-row__eyebrow">
                      {action.emphasis === "primary" ? "Start here" : "Routine"}
                    </span>
                    <strong>{action.label}</strong>
                    <p>{action.description}</p>
                  </div>
                  <Link
                    href={action.href}
                    className={
                      action.emphasis === "primary"
                        ? "mv-btn mv-btn-primary dashboard-admin-action-row__cta"
                        : "mv-btn mv-btn-outline dashboard-admin-action-row__cta"
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

        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Studio snapshot</div>
              <h2>Health of the week</h2>
              <p>Queue, demand, and attendance signals with their next implication.</p>
            </div>
            <DashboardStatusBadge label="Weekly read" tone="accent" />
          </div>

          <div className="dashboard-summary-list">
            {adminOverviewData.studioSnapshot.map((item) => (
              <div key={item.id} className="dashboard-admin-snapshot-row">
                <div className="dashboard-admin-snapshot-row__header">
                  <div className="dashboard-admin-snapshot-row__meta">
                    <DashboardStatusBadge
                      label={item.label}
                      tone={getSnapshotTone(item.label)}
                    />
                    <small>{getSnapshotImplication(item.label)}</small>
                  </div>
                  <strong>{item.value}</strong>
                </div>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
