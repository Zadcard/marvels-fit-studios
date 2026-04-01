import Link from "next/link";
import { ArrowRight, CreditCard, ShieldUser, Sparkles } from "lucide-react";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { clientOverviewData } from "@/lib/mocks/client-overview";

function getSessionBadgeClass(status: "Booked" | "Check-in ready" | "Waitlist") {
  if (status === "Check-in ready") {
    return "dashboard-badge dashboard-badge--success";
  }

  if (status === "Waitlist") {
    return "dashboard-badge dashboard-badge--warning";
  }

  return "dashboard-badge dashboard-badge--accent";
}

export function ClientOverviewWorkspace() {
  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Member overview"
        title="Client Dashboard"
        description="A simple personal view of your next sessions, your current plan, and the coach support around your training."
        actions={
          <Link href="/client/sessions" className="mv-btn mv-btn-primary">
            <Sparkles size={16} />
            Review My Week
          </Link>
        }
      />

      <section className="dashboard-kpi-grid" aria-label="Client overview stats">
        {clientOverviewData.stats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="dashboard-overview-grid">
        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Coming up</div>
              <h2>Upcoming sessions</h2>
              <p>Your next training moments, kept easy to scan on mobile and desktop.</p>
            </div>
          </div>

          <div className="dashboard-session-list">
            {clientOverviewData.upcomingSessions.map((session) => (
              <article key={session.id} className="dashboard-session-card">
                <div className="dashboard-session-card__meta">
                  <span className={getSessionBadgeClass(session.status)}>
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
                  <span className="dashboard-badge">{session.coachName}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Progress pulse</div>
              <h2>Recent updates</h2>
              <p>Small, relevant changes so your dashboard feels helpful, not crowded.</p>
            </div>
          </div>

          <DashboardActivityFeed items={clientOverviewData.recentActivity} />
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Your coach</div>
              <h2>Coach snapshot</h2>
              <p>A fast view of who is guiding the current phase of your plan.</p>
            </div>
            <ShieldUser size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>{clientOverviewData.coachSnapshot.fullName}</strong>
              <span>{clientOverviewData.coachSnapshot.roleLabel}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Specialization</strong>
              <span>{clientOverviewData.coachSnapshot.specialization}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Next touchpoint</strong>
              <span>{clientOverviewData.coachSnapshot.nextTouchpoint}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Coach note</strong>
              <span>{clientOverviewData.coachSnapshot.note}</span>
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Membership</div>
              <h2>Subscription snapshot</h2>
              <p>Your current plan and renewal state, kept readable without billing complexity.</p>
            </div>
            <CreditCard size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>{clientOverviewData.subscriptionSnapshot.planName}</strong>
              <span>{clientOverviewData.subscriptionSnapshot.benefitLine}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Renewal</strong>
              <span>{clientOverviewData.subscriptionSnapshot.renewalLabel}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Payment status</strong>
              <span>{clientOverviewData.subscriptionSnapshot.paymentStatus}</span>
            </div>
          </div>

          <div className="dashboard-quick-grid">
            {clientOverviewData.quickActions.map((action) => {
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
        </article>
      </section>
    </div>
  );
}
