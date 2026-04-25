"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Download, Files, ShieldUser, Sparkles } from "lucide-react";

import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import type { ClientOverviewData } from "@/lib/dashboard/client-dashboard-data";

function getSessionBadgeClass(status: "Booked" | "Check-in ready" | "Waitlist") {
  if (status === "Check-in ready") {
    return "dashboard-badge dashboard-badge--success";
  }

  if (status === "Waitlist") {
    return "dashboard-badge dashboard-badge--warning";
  }

  return "dashboard-badge dashboard-badge--accent";
}

type ClientOverviewWorkspaceProps = {
  data: ClientOverviewData;
};

export function ClientOverviewWorkspace({ data }: ClientOverviewWorkspaceProps) {
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const bookedThisWeek = data.upcomingSessions.length;
  const readyNow = data.upcomingSessions.filter(
    (session) => session.status === "Check-in ready"
  ).length;

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Member overview"
        actions={
          <>
            <button
              type="button"
              className={data.activeFiles.length > 0 ? "mv-btn mv-btn-secondary" : "mv-btn mv-btn-outline"}
              onClick={() => setIsFilesOpen(true)}
            >
              <Files size={16} />
              Files {data.activeFiles.length > 0 ? `(${data.activeFiles.length})` : ""}
            </button>
            <Link href="/client/sessions" className="mv-btn mv-btn-primary">
              <Sparkles size={16} />
              Review My Week
            </Link>
          </>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Overview"
        title="Your next sessions, coach details, and plan status stay in one place."
        description="Use this page as a quick read before you open details."
        items={[
          `${bookedThisWeek} upcoming sessions in view.`,
          `${readyNow} ready for check-in.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Client overview highlights">
        <DashboardMiniStat
          label="Next touchpoint"
          value={data.coachSnapshot.nextTouchpoint}
          description="Next coach touchpoint."
        />
        <DashboardMiniStat
          label="Membership state"
          value={data.subscriptionSnapshot.paymentStatus}
          description={data.subscriptionSnapshot.renewalLabel}
        />
        <DashboardMiniStat
          label="Weekly view"
          value={`${bookedThisWeek} sessions`}
          description="Booked this week."
        />
      </section>

      <section className="dashboard-kpi-grid" aria-label="Client overview stats">
        {data.stats.map((stat) => (
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
            {data.upcomingSessions.map((session) => (
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
              <p>Relevant changes only.</p>
            </div>
          </div>

          <DashboardActivityFeed items={data.recentActivity} />
        </article>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Your coach</div>
              <h2>Coach snapshot</h2>
              <p>Your current coach and focus.</p>
            </div>
            <ShieldUser size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>{data.coachSnapshot.fullName}</strong>
              <span>{data.coachSnapshot.roleLabel}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Specialization</strong>
              <span>{data.coachSnapshot.specialization}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Next touchpoint</strong>
              <span>{data.coachSnapshot.nextTouchpoint}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Support summary</strong>
              <span>{data.coachSnapshot.note}</span>
            </div>
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--accent">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Membership</div>
              <h2>Subscription snapshot</h2>
              <p>Your current plan and renewal state.</p>
            </div>
            <CreditCard size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>{data.subscriptionSnapshot.planName}</strong>
              <span>{data.subscriptionSnapshot.benefitLine}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Renewal</strong>
              <span>{data.subscriptionSnapshot.renewalLabel}</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Payment status</strong>
              <span>{data.subscriptionSnapshot.paymentStatus}</span>
            </div>
          </div>

          <div className="dashboard-quick-grid">
            {data.quickActions.map((action) => {
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

          <div className="dashboard-info-strip">
            <strong>Billing summary</strong>
            <p>Renewal and balance details appear here.</p>
          </div>
        </article>
      </section>

      <DashboardModal
        open={isFilesOpen}
        onClose={() => setIsFilesOpen(false)}
        title="Coach files"
        description="Files your coach shared for download. Files expire after 3 days."
        size="wide"
      >
        {data.activeFiles.length > 0 ? (
          <div className="dashboard-summary-list">
            {data.activeFiles.map((file) => (
              <div key={file.id} className="dashboard-summary-row">
                <div>
                  <strong>{file.name}</strong>
                  <span>{file.note}</span>
                  <small>
                    Uploaded {file.uploadedAtLabel} - expires {file.expiresAtLabel}
                  </small>
                </div>
                <a className="mv-btn mv-btn-outline" href={file.downloadHref}>
                  <Download size={16} />
                  Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            title="No active files"
            description="New coach uploads will appear here."
          />
        )}
      </DashboardModal>
    </div>
  );
}
