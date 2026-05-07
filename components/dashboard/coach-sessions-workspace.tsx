"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  assignCoachClientToSession,
  removeCoachClientFromSession,
} from "@/app/actions/coach-session-bookings";
import { saveCoachSessionNote } from "@/app/actions/coach-session-notes";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  coachSessionStatusFilters,
  coachSessionTypeFilters,
  type CoachSessionBookingStatus,
  type CoachSessionRecord,
  type CoachSessionStatus,
  type CoachSessionType,
} from "@/lib/dashboard/coach-session-data";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";

type CoachSessionSort = "soonest" | "latest" | "status" | "type";

const coachSessionSortOptions: Array<{ label: string; value: CoachSessionSort }> = [
  { label: "Soonest", value: "soonest" },
  { label: "Latest", value: "latest" },
  { label: "Status", value: "status" },
  { label: "Type", value: "type" },
];

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
  const [isManagingRoster, startRosterTransition] = useTransition();
  const [isSavingNote, startNoteTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [typeFilter, setTypeFilter] = useState<"All" | CoachSessionType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CoachSessionStatus>("All");
  const [sortOrder, setSortOrder] = useState<CoachSessionSort>("soonest");
  const [page, setPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState(records[0]?.id ?? "");
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clientOptions[0]?.id ?? "");
  const [noteDraft, setNoteDraft] = useState(records[0]?.noteValue ?? "");
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
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((left, right) => {
      const leftTiming = `${left.dayLabel} ${left.timeLabel}`;
      const rightTiming = `${right.dayLabel} ${right.timeLabel}`;
      if (sortOrder === "latest") return rightTiming.localeCompare(leftTiming);
      if (sortOrder === "status") return left.status.localeCompare(right.status);
      if (sortOrder === "type") return left.sessionType.localeCompare(right.sessionType);
      return leftTiming.localeCompare(rightTiming);
    });
  }, [filteredSessions, sortOrder]);
  const paginatedSessions = paginateDashboardItems(sortedSessions, page);

  useEffect(() => {
    if (!filteredSessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId(filteredSessions[0]?.id ?? "");
    }
  }, [filteredSessions, selectedSessionId]);

  const selectedSession =
    filteredSessions.find((session) => session.id === selectedSessionId) ??
    filteredSessions[0];
  const detailSession =
    filteredSessions.find((session) => session.id === detailSessionId) ?? null;

  useEffect(() => {
    setNoteDraft(selectedSession?.noteValue ?? "");
  }, [selectedSession?.id, selectedSession?.noteValue]);

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

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter, sortOrder]);

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
    setDetailSessionId(sessionId);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const handleSaveNote = () => {
    if (!selectedSession) {
      return;
    }

    setFeedbackMessage("");

    startNoteTransition(async () => {
      try {
        const result = await saveCoachSessionNote(selectedSession.id, noteDraft);
        setNoteDraft(result.content);
        setFeedbackMessage("Session note saved.");
        router.refresh();
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error ? error.message : "Could not save session note."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Coach sessions" />

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by session, focus, or location"
            searchSuggestions={records.map((session) => ({
              label: session.title,
              value: session.title,
              detail: `${session.focus} - ${session.location}`,
            }))}
            summary={`${filteredSessions.length} assigned sessions in view`}
            sortValue={sortOrder}
            sortOptions={coachSessionSortOptions}
            onSortChange={(value) => setSortOrder(value as CoachSessionSort)}
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
              <strong>Session update</strong>
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
                      {paginatedSessions.items.map((session) => (
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
                  {paginatedSessions.items.map((session) => (
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
          <DashboardPaginationControls
            page={paginatedSessions.page}
            pageCount={paginatedSessions.pageCount}
            startItem={paginatedSessions.startItem}
            endItem={paginatedSessions.endItem}
            totalItems={paginatedSessions.totalItems}
            onPageChange={setPage}
          />
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

              <div className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <div>
                    <div className="mv-eyebrow">Progress note</div>
                    <h2>Update session note</h2>
                    <p>This note is saved to the session and shared across the dashboards.</p>
                  </div>
                </div>
                <div className="dashboard-form-grid">
                  <label className="dashboard-form-field dashboard-form-field--wide">
                    <span>Coach note</span>
                    <textarea
                      className="dashboard-input"
                      rows={5}
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                    />
                  </label>
                </div>
                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="mv-btn mv-btn-primary"
                    onClick={handleSaveNote}
                    disabled={isSavingNote || noteDraft.trim().length === 0}
                  >
                    {isSavingNote ? "Saving note..." : "Save note"}
                  </button>
                </div>
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
                      <p>Attendance is recorded by admin. Coaches can review status here.</p>
                    </div>
                  </div>

                  {selectedSession.bookings.length > 0 ? (
                    <>
                      <div className="dashboard-selection-summary">
                        <strong>Attendance recorded by admin</strong>
                        <p>Roster status is visible here after the front desk updates it.</p>
                      </div>
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
                                onClick={() => handleRemoveClient(booking.clientId)}
                                disabled={isManagingRoster}
                              >
                                Unassign
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
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

      <DashboardModal
        open={!!detailSession}
        onClose={() => setDetailSessionId(null)}
        title={detailSession?.title ?? "Session details"}
        description={detailSession?.focus}
        size="wide"
      >
        {detailSession ? (
          <div className="dashboard-stack">
            <div className="dashboard-detail-grid">
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Timing</span>
                <strong>{detailSession.timeLabel}</strong>
                <small>{detailSession.dayLabel}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Type</span>
                <strong>{detailSession.sessionType}</strong>
                <small>{detailSession.location}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Status</span>
                <strong>{detailSession.status}</strong>
                <small>Current session status</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Roster</span>
                <strong>{detailSession.rosterLabel}</strong>
                <small>Occupancy or assigned client</small>
              </div>
            </div>

            <div className="dashboard-contact-block">
              <span className="dashboard-detail-stat__label">Coach note</span>
              <p>{detailSession.note}</p>
            </div>

            {detailSession.bookings.length > 0 ? (
              <div className="dashboard-summary-list">
                {detailSession.bookings.map((booking) => (
                  <div key={booking.clientId} className="dashboard-summary-row">
                    <strong>{booking.fullName}</strong>
                    <span>{booking.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="No active bookings yet"
                description="This session does not have any booked clients to review."
              />
            )}
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
