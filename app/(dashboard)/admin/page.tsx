import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CirclePlus,
  ClipboardList,
  UserPlus,
} from "lucide-react";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";
import { adminLeadRepository } from "@/lib/repositories/admin-lead-repository";
import { adminScheduleRepository } from "@/lib/repositories/admin-schedule-repository";
import { adminSubscriptionRepository } from "@/lib/repositories/admin-subscription-repository";

export const metadata = {
  title: "Admin Dashboard",
};

function getStatusTone(
  status: "Confirmed" | "Waitlist" | "Attention" | "Completed"
) {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Waitlist":
      return "warning";
    case "Attention":
      return "accent";
    default:
      return "neutral";
  }
}

function getSubscriptionTone(status: string) {
  switch (status) {
    case "Paid":
      return "success";
    case "Due soon":
    case "Overdue":
      return "warning";
    case "Pending renewal":
      return "warning";
    default:
      return "neutral";
  }
}

export default async function AdminOverviewPage() {
  const [schedule, clients, joinRequests, packages] = await Promise.all([
    adminScheduleRepository.getSchedule(),
    adminClientRepository.list(),
    adminLeadRepository.list(),
    adminSubscriptionRepository.list(),
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todaySessions = schedule.records
    .filter((record) => {
      const startsAt = new Date(record.startsAt);
      return startsAt >= todayStart && startsAt <= todayEnd;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const liveNowSessions = todaySessions.filter((record) => {
    const current = now.getTime();
    const startsAt = new Date(record.startsAt).getTime();
    const endsAt = new Date(record.endsAt).getTime();

    return current >= startsAt && current <= endsAt;
  });

  const activeClients = clients.filter((client) => client.status === "Active").length;
  const pendingJoinRequests = joinRequests.filter(
    (request) => request.status === "New" || request.status === "Contacted"
  );

  const renewalAttention = packages.records
    .filter((record) => {
      const renewalDate = record.renewalDateValue
        ? new Date(record.renewalDateValue)
        : null;

      return (
        record.subscriptionStatus === "Pending renewal" ||
        record.paymentStatus === "Due soon" ||
        record.paymentStatus === "Overdue" ||
        (renewalDate !== null &&
          renewalDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000)
      );
    })
    .slice(0, 5);

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Admin operations"
        actions={
          <>
            <Link href="/admin/schedule" className="mv-btn mv-btn-secondary">
              <CirclePlus size={16} />
              Create Recurring Session
            </Link>
            <Link href="/admin/clients" className="mv-btn mv-btn-primary">
              <UserPlus size={16} />
              Add Client
            </Link>
          </>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Studio pulse"
        title={
          liveNowSessions.length > 0
            ? `${liveNowSessions.length} session${
                liveNowSessions.length === 1 ? "" : "s"
              } are live right now.`
            : "No session is live right now, so today's work is schedule follow-through and renewal cleanup."
        }
        description="Use the dashboard to move between the live board, today's schedule, package follow-up, and incoming requests without carrying generic SaaS widgets."
        items={[
          `${todaySessions.length} sessions are on today's board.`,
          `${renewalAttention.length} client packages need renewal or payment follow-up.`,
          `${pendingJoinRequests.length} join requests still need a decision.`,
        ]}
      />

      <section className="dashboard-mini-grid dashboard-admin-priority-grid">
        <DashboardMiniStat
          tone="accent"
          label="Active clients"
          value={activeClients}
          description="Clients currently active in the roster."
        />
        <DashboardMiniStat
          tone={todaySessions.length > 0 ? "success" : "neutral"}
          label="Sessions today"
          value={todaySessions.length}
          description="Live, upcoming, and completed on today's board."
        />
        <DashboardMiniStat
          tone={renewalAttention.length > 0 ? "warning" : "success"}
          label="Renewal attention"
          value={renewalAttention.length}
          description="Packages nearing renewal or payment follow-up."
        />
        <DashboardMiniStat
          tone={pendingJoinRequests.length > 0 ? "accent" : "success"}
          label="Join requests"
          value={pendingJoinRequests.length}
          description="New and contacted requests waiting on action."
        />
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Live now</div>
              <h2>Current session board</h2>
              <p>
                Open a session when attendance or last-minute changes need
                attention while it is running.
              </p>
            </div>
            <Link href="/admin/sessions" className="mv-btn mv-btn-outline">
              Open sessions
            </Link>
          </div>

          {liveNowSessions.length > 0 ? (
            <div className="dashboard-summary-list">
              {liveNowSessions.map((session) => (
                <div key={session.id} className="dashboard-summary-row">
                  <strong>{session.title}</strong>
                  <span>
                    {session.timeRange} · {session.coachName} · {session.groupName}
                  </span>
                  <div className="dashboard-panel__meta-strip">
                    <span>{session.location}</span>
                    <span>{session.occupancyLabel}</span>
                    <DashboardStatusBadge
                      label={session.status}
                      tone={getStatusTone(session.status)}
                    />
                    <Link href="/admin/sessions" className="dashboard-inline-button">
                      Open session
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No session is live right now"
              description="Use today's schedule below to move into the next upcoming session or open the full sessions board."
            />
          )}
        </article>

        <aside className="dashboard-panel dashboard-detail-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Join requests</div>
              <h2>Incoming demand</h2>
              <p>
                Keep intake visible without turning it into a separate dashboard
                system.
              </p>
            </div>
            <Link
              href="/admin/join-requests"
              className="mv-btn mv-btn-outline"
            >
              Open requests
            </Link>
          </div>

          {pendingJoinRequests.length > 0 ? (
            <div className="dashboard-summary-list">
              {pendingJoinRequests.slice(0, 4).map((request) => (
                <div key={request.id} className="dashboard-summary-row">
                  <strong>{request.fullName}</strong>
                  <span>
                    {request.phone} · {request.source} · {request.createdAt}
                  </span>
                  <div className="dashboard-panel__meta-strip">
                    <DashboardStatusBadge
                      label={request.status}
                      tone={request.status === "New" ? "accent" : "warning"}
                    />
                    <span>{request.email}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No pending join requests"
              description="When new requests come in, they will surface here and in the join requests workspace."
            />
          )}
        </aside>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Today's schedule</div>
              <h2>Ordered session board</h2>
              <p>
                Move through the day from upcoming sessions to completed ones
                without leaving the admin workspace.
              </p>
            </div>
            <Link href="/admin/schedule" className="mv-btn mv-btn-outline">
              Open schedule
            </Link>
          </div>

          {todaySessions.length > 0 ? (
            <div className="dashboard-summary-list">
              {todaySessions.slice(0, 8).map((session) => (
                <div key={session.id} className="dashboard-summary-row">
                  <strong>
                    {session.timeRange} · {session.title}
                  </strong>
                  <span>
                    {session.coachName} · {session.groupName} · {session.location}
                  </span>
                  <div className="dashboard-panel__meta-strip">
                    <DashboardStatusBadge
                      label={session.status}
                      tone={getStatusTone(session.status)}
                    />
                    <span>{session.occupancyLabel}</span>
                    <span>{session.scheduleBlockTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No sessions are on today's board"
              description="Create a recurring session or add a one-off occurrence to start filling the day."
            />
          )}
        </article>

        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Renewal attention</div>
              <h2>Package follow-up</h2>
              <p>
                Keep expiring and unpaid client packages visible from the main
                admin workspace.
              </p>
            </div>
            <Link href="/admin/clients" className="mv-btn mv-btn-outline">
              Open clients
            </Link>
          </div>

          {renewalAttention.length > 0 ? (
            <div className="dashboard-summary-list">
              {renewalAttention.map((record) => (
                <div key={record.id} className="dashboard-summary-row">
                  <strong>{record.memberName}</strong>
                  <span>
                    {record.planName} · {record.amountLabel} · renews{" "}
                    {record.renewalDate}
                  </span>
                  <div className="dashboard-panel__meta-strip">
                    <DashboardStatusBadge
                      label={record.subscriptionStatus}
                      tone={
                        record.subscriptionStatus === "Pending renewal"
                          ? "warning"
                          : "neutral"
                      }
                    />
                    <DashboardStatusBadge
                      label={record.paymentStatus}
                      tone={getSubscriptionTone(record.paymentStatus)}
                    />
                    <span>{record.assignedCoach}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No packages need follow-up right now"
              description="Renewal and payment pressure will surface here when clients approach their next package review."
            />
          )}
        </article>
      </section>

      <section className="dashboard-panel dashboard-panel--dense">
        <div className="dashboard-panel__header dashboard-panel__header--tight">
          <div>
            <div className="mv-eyebrow">Shortcuts</div>
            <h2>Jump to the main admin surfaces</h2>
            <p>
              The dashboard stays light. The detailed work still lives in the
              dedicated workspace pages.
            </p>
          </div>
        </div>

        <div className="dashboard-summary-list">
          <div className="dashboard-summary-row">
            <strong>Sessions</strong>
            <span>
              Open the session board for one-off attendance, cancellations, and
              quick edits.
            </span>
            <Link href="/admin/sessions" className="dashboard-inline-button">
              Open sessions <ArrowRight size={14} />
            </Link>
          </div>
          <div className="dashboard-summary-row">
            <strong>Schedule</strong>
            <span>
              Manage recurring session structure, timing, and weekly planning.
            </span>
            <Link href="/admin/schedule" className="dashboard-inline-button">
              <CalendarRange size={14} />
              Open schedule
            </Link>
          </div>
          <div className="dashboard-summary-row">
            <strong>Join requests</strong>
            <span>
              Review new inquiries, contact them, and convert the ready ones
              into clients.
            </span>
            <Link
              href="/admin/join-requests"
              className="dashboard-inline-button"
            >
              <ClipboardList size={14} />
              Open requests
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
