"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  clientSessionPeriodFilters,
  clientSessionTypeFilters,
  type ClientSessionPeriod,
  type ClientSessionRecord,
  type ClientSessionStatus,
  type ClientSessionType,
} from "@/lib/dashboard/client-dashboard-data";

function getSessionTone(status: ClientSessionStatus) {
  switch (status) {
    case "Check-in ready":
      return "success";
    case "You attended":
      return "success";
    case "You missed":
      return "warning";
    case "Booked":
    case "Waitlist":
      return "accent";
    default:
      return "neutral";
  }
}

function getStatusCopy(status: ClientSessionStatus) {
  switch (status) {
    case "You attended":
      return "Admin recorded this booking as attended.";
    case "You missed":
      return "Admin recorded this booking as missed.";
    case "Cancelled":
      return "This booking was canceled and will not count toward attendance.";
    case "Waitlist":
      return "You are currently on the waitlist for this session.";
    case "Check-in ready":
      return "This booking is coming up soon and is ready for check-in.";
    default:
      return "Booking and attendance updates appear here.";
  }
}

function getDetailStatusLabel(status: ClientSessionStatus) {
  switch (status) {
    case "You attended":
    case "You missed":
      return "Attendance outcome";
    case "Cancelled":
      return "Booking status";
    default:
      return "Current session status";
  }
}

function getStatusSummaryLabel(status: ClientSessionStatus) {
  switch (status) {
    case "You attended":
    case "You missed":
      return "Attendance recorded";
    case "Cancelled":
      return "Booking update";
    default:
      return "Session note";
  }
}

function getStatusSummaryCopy(status: ClientSessionStatus) {
  switch (status) {
    case "You attended":
      return "You attended this session.";
    case "You missed":
      return "You missed this session.";
    default:
      return getStatusCopy(status);
  }
}

type ClientSessionsWorkspaceProps = {
  records: ClientSessionRecord[];
};

export function ClientSessionsWorkspace({ records }: ClientSessionsWorkspaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [periodFilter, setPeriodFilter] = useState<"All" | ClientSessionPeriod>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | ClientSessionType>("All");
  const [selectedSessionId, setSelectedSessionId] = useState(records[0]?.id ?? "");

  const filteredSessions = records.filter((session) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [session.title, session.location, session.coachName, session.note]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesPeriod =
      periodFilter === "All" || session.period === periodFilter;
    const matchesType = typeFilter === "All" || session.sessionType === typeFilter;

    return matchesSearch && matchesPeriod && matchesType;
  });

  useEffect(() => {
    if (!filteredSessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId(filteredSessions[0]?.id ?? "");
    }
  }, [filteredSessions, selectedSessionId]);

  const selectedSession =
    filteredSessions.find((session) => session.id === selectedSessionId) ??
    filteredSessions[0];
  const hasActiveFilters =
    searchTerm.trim().length > 0 || periodFilter !== "All" || typeFilter !== "All";
  const upcomingCount = filteredSessions.filter(
    (session) => session.period === "Upcoming"
  ).length;
  const readyCount = filteredSessions.filter(
    (session) => session.status === "Check-in ready"
  ).length;
  const privateCount = filteredSessions.filter(
    (session) => session.sessionType === "Private"
  ).length;

  const resetFilters = () => {
    setSearchTerm("");
    setPeriodFilter("All");
    setTypeFilter("All");
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My sessions" />

      <DashboardSurfaceNote
        eyebrow="Sessions"
        title="Review upcoming and past sessions in one place."
        description="Filter the list, then open a session for details."
        items={[
          `${upcomingCount} upcoming sessions in view.`,
          `${readyCount} ready for check-in.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Client session highlights">
        <DashboardMiniStat
          label="Upcoming"
          value={upcomingCount}
          description="Still ahead."
        />
        <DashboardMiniStat
          label="Check-in ready"
          value={readyCount}
          description="Ready now."
        />
        <DashboardMiniStat
          label="Private"
          value={privateCount}
          description="Private sessions."
        />
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by session, coach, or location"
            summary={`${filteredSessions.length} sessions in view`}
            isFiltered={hasActiveFilters}
            onReset={resetFilters}
            filters={
              <>
                <label className="dashboard-filter-field">
                  <span>Period</span>
                  <select
                    className="dashboard-select"
                    value={periodFilter}
                    onChange={(event) =>
                      setPeriodFilter(event.target.value as "All" | ClientSessionPeriod)
                    }
                  >
                    {clientSessionPeriodFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Type</span>
                  <select
                    className="dashboard-select"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as "All" | ClientSessionType)
                    }
                  >
                    {clientSessionTypeFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
          />

          {filteredSessions.length > 0 ? (
            <div className="dashboard-mobile-list dashboard-mobile-list--always">
              {filteredSessions.map((session) => (
                <article
                  key={session.id}
                  className={
                    selectedSessionId === session.id
                      ? "dashboard-record-card dashboard-record-card--active"
                      : "dashboard-record-card"
                  }
                >
                  <div className="dashboard-record-card__header">
                    <div>
                      <h3>{session.title}</h3>
                      <p>
                        {session.dayLabel}, {session.timeLabel}
                      </p>
                    </div>
                    <DashboardStatusBadge
                      label={session.status}
                      tone={getSessionTone(session.status)}
                    />
                  </div>
                  <div className="dashboard-record-card__meta">
                    <span>{session.period}</span>
                    <span>{session.sessionType}</span>
                    <span>{session.location}</span>
                  </div>
                  <p className="dashboard-record-card__note">{session.note}</p>
                  <div className="dashboard-info-strip">
                    <strong>{getStatusSummaryLabel(session.status)}</strong>
                    <p>{getStatusSummaryCopy(session.status)}</p>
                  </div>
                  <div className="dashboard-row-actions">
                    <button
                      type="button"
                      className="dashboard-inline-button"
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      Review detail
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No sessions match these filters"
              description="Try a different search or reset the filters."
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          )}
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          {selectedSession ? (
            <>
              <div className="dashboard-panel__header">
                <div>
                  <div className="mv-eyebrow">Selected session</div>
                  <h2>{selectedSession.title}</h2>
                  <p>{selectedSession.coachName}</p>
                </div>
                <CalendarClock size={20} color="#ff8b8f" />
              </div>

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">When</span>
                  <strong>{selectedSession.dayLabel}</strong>
                  <small>{selectedSession.timeLabel}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Type</span>
                  <strong>{selectedSession.sessionType}</strong>
                  <small>{selectedSession.period}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">
                    {getDetailStatusLabel(selectedSession.status)}
                  </span>
                  <strong>{selectedSession.status}</strong>
                  <small>{getStatusCopy(selectedSession.status)}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Location</span>
                  <strong>{selectedSession.location}</strong>
                  <small>{selectedSession.coachName}</small>
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Session note</span>
                <p>{selectedSession.note}</p>
              </div>

              <div className="dashboard-info-strip">
                <strong>{getStatusSummaryLabel(selectedSession.status)}</strong>
                <p>{getStatusSummaryCopy(selectedSession.status)}</p>
              </div>
            </>
          ) : (
            <DashboardEmptyState
              title="Session detail unavailable"
              description="Choose a session to review details."
            />
          )}
        </aside>
      </section>
    </div>
  );
}
