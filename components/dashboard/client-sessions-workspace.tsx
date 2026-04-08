"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
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
    case "Booked":
      return "accent";
    default:
      return "neutral";
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
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Upcoming</span>
          <strong>{upcomingCount}</strong>
          <p>Still ahead.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Check-in ready</span>
          <strong>{readyCount}</strong>
          <p>Ready now.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Private</span>
          <strong>{privateCount}</strong>
          <p>Private sessions.</p>
        </article>
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
                  <span className="dashboard-detail-stat__label">Status</span>
                  <strong>{selectedSession.status}</strong>
                  <small>Current session status</small>
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
                <strong>Session note</strong>
                <p>Booking and attendance updates appear here.</p>
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
