"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  coachSessionRecords,
  coachSessionStatusFilters,
  coachSessionTypeFilters,
  type CoachSessionStatus,
  type CoachSessionType,
} from "@/lib/mocks/coach-sessions";

function getCoachSessionTone(status: CoachSessionStatus) {
  switch (status) {
    case "Ready":
      return "success";
    case "Waitlist":
      return "warning";
    case "Prep":
      return "accent";
    default:
      return "neutral";
  }
}

function getCoachTypeTone(type: CoachSessionType) {
  return type === "Group" ? "accent" : "neutral";
}

export function CoachSessionsWorkspace() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [typeFilter, setTypeFilter] = useState<"All" | CoachSessionType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CoachSessionStatus>("All");
  const [selectedSessionId, setSelectedSessionId] = useState(
    coachSessionRecords[0]?.id ?? ""
  );

  const filteredSessions = coachSessionRecords.filter((session) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [session.title, session.location, session.focus, session.note]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesType = typeFilter === "All" || session.sessionType === typeFilter;
    const matchesStatus = statusFilter === "All" || session.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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
    searchTerm.trim().length > 0 || typeFilter !== "All" || statusFilter !== "All";
  const readySessions = filteredSessions.filter(
    (session) => session.status === "Ready"
  ).length;
  const groupSessions = filteredSessions.filter(
    (session) => session.sessionType === "Group"
  ).length;

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Coach sessions" />

      <DashboardSurfaceNote
        eyebrow="Sessions"
        title="Track the sessions you are responsible for."
        description="Filter the list, then open a session for details."
        items={[
          `${readySessions} ready sessions.`,
          `${groupSessions} group sessions.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach session highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Sessions in view</span>
          <strong>{filteredSessions.length}</strong>
          <p>Current load.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Ready</span>
          <strong>{readySessions}</strong>
          <p>Ready now.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Group blocks</span>
          <strong>{groupSessions}</strong>
          <p>Group sessions.</p>
        </article>
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by session, focus, or location"
            summary={`${filteredSessions.length} assigned sessions in view`}
            isFiltered={hasActiveFilters}
            onReset={resetFilters}
            filters={
              <>
                <label className="dashboard-filter-field">
                  <span>Type</span>
                  <select
                    className="dashboard-select"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as "All" | CoachSessionType)
                    }
                  >
                    {coachSessionTypeFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Status</span>
                  <select
                    className="dashboard-select"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "All" | CoachSessionStatus)
                    }
                  >
                    {coachSessionStatusFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
          />

          <div className="dashboard-data-region">
            {filteredSessions.length > 0 ? (
              <>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Timing</th>
                        <th>Roster</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr key={session.id}>
                          <td>
                            <div className="dashboard-table__identity">
                              <strong>{session.title}</strong>
                              <span>{session.location}</span>
                              <small>{session.focus}</small>
                            </div>
                          </td>
                          <td>
                            <DashboardStatusBadge
                              label={session.sessionType}
                              tone={getCoachTypeTone(session.sessionType)}
                            />
                          </td>
                          <td>
                            <DashboardStatusBadge
                              label={session.status}
                              tone={getCoachSessionTone(session.status)}
                            />
                          </td>
                          <td>
                            {session.dayLabel}, {session.timeLabel}
                          </td>
                          <td>{session.rosterLabel}</td>
                          <td>
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              Open detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="dashboard-mobile-list">
                  {filteredSessions.map((session) => (
                    <article key={session.id} className="dashboard-record-card">
                      <div className="dashboard-record-card__header">
                        <div>
                          <h3>{session.title}</h3>
                          <p>
                            {session.dayLabel}, {session.timeLabel}
                          </p>
                        </div>
                        <DashboardStatusBadge
                          label={session.status}
                          tone={getCoachSessionTone(session.status)}
                        />
                      </div>
                      <div className="dashboard-record-card__meta">
                        <span>{session.sessionType}</span>
                        <span>{session.location}</span>
                        <span>{session.rosterLabel}</span>
                      </div>
                      <p className="dashboard-record-card__note">{session.note}</p>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          View detail
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
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
          </div>
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          {selectedSession ? (
            <>
              <div className="dashboard-panel__header">
                <div>
                  <div className="mv-eyebrow">Selected session</div>
                  <h2>{selectedSession.title}</h2>
                  <p>{selectedSession.focus}</p>
                </div>
                <ClipboardCheck size={20} color="#ff8b8f" />
              </div>

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Timing</span>
                  <strong>{selectedSession.timeLabel}</strong>
                  <small>{selectedSession.dayLabel}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Type</span>
                  <strong>{selectedSession.sessionType}</strong>
                  <small>{selectedSession.location}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Status</span>
                  <strong>{selectedSession.status}</strong>
                  <small>Current session status</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Roster</span>
                  <strong>{selectedSession.rosterLabel}</strong>
                  <small>Occupancy or assigned client</small>
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Coach note</span>
                <p>{selectedSession.note}</p>
              </div>

              <div className="dashboard-info-strip">
                <strong>Attendance</strong>
                <p>Attendance and note updates appear here.</p>
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
