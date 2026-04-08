"use client";

import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  assignCoachClientToSession,
  removeCoachClientFromSession,
} from "@/app/actions/coach-session-bookings";
import { updateCoachAttendance } from "@/app/actions/coach-attendance";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  coachSessionStatusFilters,
  coachSessionTypeFilters,
  type CoachSessionBookingStatus,
  type CoachSessionRecord,
  type CoachSessionStatus,
  type CoachSessionType,
} from "@/lib/dashboard/coach-session-data";

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

function getBookingTone(status: CoachSessionBookingStatus) {
  switch (status) {
    case "Attended":
      return "success";
    case "Missed":
      return "warning";
    case "Waitlist":
      return "accent";
    default:
      return "neutral";
  }
}

type CoachSessionsWorkspaceProps = {
  records: CoachSessionRecord[];
  clientOptions: Array<{
    id: string;
    fullName: string;
  }>;
};

export function CoachSessionsWorkspace({
  records,
  clientOptions,
}: CoachSessionsWorkspaceProps) {
  const router = useRouter();
  const [isUpdatingAttendance, startAttendanceTransition] = useTransition();
  const [isManagingRoster, startRosterTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [typeFilter, setTypeFilter] = useState<"All" | CoachSessionType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CoachSessionStatus>("All");
  const [selectedSessionId, setSelectedSessionId] = useState(records[0]?.id ?? "");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clientOptions[0]?.id ?? "");
  const detailRef = useRef<HTMLElement | null>(null);

  const filteredSessions = records.filter((session) => {
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
  const availableClientOptions = clientOptions.filter(
    (client) =>
      !selectedSession?.bookings.some((booking) => booking.clientId === client.id)
  );
  const filteredClientOptions = availableClientOptions.filter((client) =>
    clientSearchTerm.trim().length === 0
      ? true
      : client.fullName.toLowerCase().includes(clientSearchTerm.trim().toLowerCase())
  );
  const resolvedSelectedClientId = filteredClientOptions.some(
    (client) => client.id === selectedClientId
  )
    ? selectedClientId
    : filteredClientOptions[0]?.id ?? "";
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

  useEffect(() => {
    if (filteredClientOptions.length === 0) {
      if (selectedClientId !== "") {
        setSelectedClientId("");
      }
      return;
    }

    if (!filteredClientOptions.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(filteredClientOptions[0]?.id ?? "");
    }
  }, [filteredClientOptions, selectedClientId]);

  const openSessionDetail = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleAttendanceUpdate = (
    trainingSessionId: string,
    clientId: string,
    status: "ATTENDED" | "MISSED"
  ) => {
    setFeedbackMessage("");

    startAttendanceTransition(async () => {
      try {
        await updateCoachAttendance(trainingSessionId, clientId, status);
        setFeedbackMessage(
          status === "ATTENDED"
            ? "Attendance marked successfully."
            : "Client marked as missed."
        );
        router.refresh();
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : "Attendance update did not complete."
        );
      }
    });
  };

  const handleAssignClient = () => {
    if (!selectedSession || !resolvedSelectedClientId) {
      return;
    }

    setFeedbackMessage("");

    startRosterTransition(async () => {
      try {
        await assignCoachClientToSession(selectedSession.id, resolvedSelectedClientId);
        setFeedbackMessage("Client assigned successfully.");
        router.refresh();
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error ? error.message : "Could not assign client."
        );
      }
    });
  };

  const handleRemoveClient = (clientId: string) => {
    if (!selectedSession) {
      return;
    }

    setFeedbackMessage("");

    startRosterTransition(async () => {
      try {
        await removeCoachClientFromSession(selectedSession.id, clientId);
        setFeedbackMessage("Client removed from session.");
        router.refresh();
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error ? error.message : "Could not remove client."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Coach sessions" />

      <DashboardSurfaceNote
        eyebrow="Sessions"
        title="Track the sessions you are responsible for."
        description="Filter the list, open a session, and update attendance from the roster."
        items={[`${readySessions} ready sessions.`, `${groupSessions} group sessions.`]}
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

          {feedbackMessage ? (
            <div className="dashboard-info-strip">
              <strong>Attendance update</strong>
              <p>{feedbackMessage}</p>
            </div>
          ) : null}

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
                              onClick={() => openSessionDetail(session.id)}
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
                          onClick={() => openSessionDetail(session.id)}
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

        <aside className="dashboard-panel dashboard-detail-panel" ref={detailRef}>
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

              <div className="dashboard-stack">
                <div className="dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <div className="mv-eyebrow">Roster management</div>
                      <h2>Assign clients</h2>
                      <p>Add or remove clients from this session.</p>
                    </div>
                  </div>

                  <div className="dashboard-form-grid">
                    <label className="dashboard-form-field">
                      <span>Search clients</span>
                      <input
                        className="dashboard-input"
                        placeholder="Search by client name"
                        value={clientSearchTerm}
                        onChange={(event) => setClientSearchTerm(event.target.value)}
                      />
                    </label>
                    <label className="dashboard-form-field">
                      <span>Client</span>
                      <select
                        className="dashboard-select"
                        value={resolvedSelectedClientId}
                        onChange={(event) => setSelectedClientId(event.target.value)}
                        disabled={filteredClientOptions.length === 0 || isManagingRoster}
                      >
                        {filteredClientOptions.length > 0 ? (
                          filteredClientOptions.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.fullName}
                            </option>
                          ))
                        ) : (
                          <option value="">
                            {availableClientOptions.length === 0
                              ? "No available clients"
                              : "No clients match this search"}
                          </option>
                        )}
                      </select>
                    </label>
                  </div>

                  <div className="dashboard-row-actions">
                    <button
                      type="button"
                      className="mv-btn mv-btn-primary"
                      onClick={handleAssignClient}
                      disabled={
                        isManagingRoster ||
                        filteredClientOptions.length === 0 ||
                        !resolvedSelectedClientId
                      }
                    >
                      {isManagingRoster ? "Saving..." : "Assign client"}
                    </button>
                  </div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <div className="mv-eyebrow">Attendance</div>
                      <h2>Session roster</h2>
                      <p>Mark each booked client as attended or missed.</p>
                    </div>
                  </div>

                  {selectedSession.bookings.length > 0 ? (
                    <div className="dashboard-mobile-list">
                      {selectedSession.bookings.map((booking) => (
                        <article key={booking.clientId} className="dashboard-record-card">
                          <div className="dashboard-record-card__header">
                            <div>
                              <h3>{booking.fullName}</h3>
                              <p>Session participant</p>
                            </div>
                            <DashboardStatusBadge
                              label={booking.status}
                              tone={getBookingTone(booking.status)}
                            />
                          </div>
                          <div className="dashboard-row-actions">
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() =>
                                handleAttendanceUpdate(
                                  selectedSession.id,
                                  booking.clientId,
                                  "ATTENDED"
                                )
                              }
                              disabled={
                                isUpdatingAttendance || booking.status === "Attended"
                              }
                            >
                              Mark attended
                            </button>
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() =>
                                handleAttendanceUpdate(
                                  selectedSession.id,
                                  booking.clientId,
                                  "MISSED"
                                )
                              }
                              disabled={isUpdatingAttendance || booking.status === "Missed"}
                            >
                              Mark missed
                            </button>
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() => handleRemoveClient(booking.clientId)}
                              disabled={isManagingRoster}
                            >
                              Unassign
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      title="No active bookings yet"
                      description="This session does not have any booked clients to mark."
                    />
                  )}
                </div>
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
