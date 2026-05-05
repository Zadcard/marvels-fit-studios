"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  clientSessionPeriodFilters,
  clientSessionTypeFilters,
  type ClientSessionPeriod,
  type ClientSessionRecord,
  type ClientSessionStatus,
  type ClientSessionType,
} from "@/lib/dashboard/client-dashboard-data";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";

type ClientSessionSort = "soonest" | "latest" | "status" | "type";

const clientSessionSortOptions: Array<{ label: string; value: ClientSessionSort }> = [
  { label: "Soonest", value: "soonest" },
  { label: "Latest", value: "latest" },
  { label: "Status", value: "status" },
  { label: "Type", value: "type" },
];

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
  const [sortOrder, setSortOrder] = useState<ClientSessionSort>("soonest");
  const [page, setPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState(records[0]?.id ?? "");
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

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
  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((left, right) => {
      const leftTiming = `${left.period} ${left.dayLabel} ${left.timeLabel}`;
      const rightTiming = `${right.period} ${right.dayLabel} ${right.timeLabel}`;
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

  useEffect(() => {
    setPage(1);
  }, [searchTerm, periodFilter, typeFilter, sortOrder]);

  const resetFilters = () => {
    setSearchTerm("");
    setPeriodFilter("All");
    setTypeFilter("All");
  };

  const openSessionDetail = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDetailSessionId(sessionId);
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My sessions" />

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by session, coach, or location"
            summary={`${filteredSessions.length} sessions in view`}
            sortValue={sortOrder}
            sortOptions={clientSessionSortOptions}
            onSortChange={(value) => setSortOrder(value as ClientSessionSort)}
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
              {paginatedSessions.items.map((session) => (
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
                      onClick={() => openSessionDetail(session.id)}
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
          <DashboardPaginationControls
            page={paginatedSessions.page}
            pageCount={paginatedSessions.pageCount}
            startItem={paginatedSessions.startItem}
            endItem={paginatedSessions.endItem}
            totalItems={paginatedSessions.totalItems}
            onPageChange={setPage}
          />
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

      <DashboardModal
        open={!!detailSession}
        onClose={() => setDetailSessionId(null)}
        title={detailSession?.title ?? "Session details"}
        description={detailSession?.coachName}
      >
        {detailSession ? (
          <div className="dashboard-stack">
            <div className="dashboard-detail-grid">
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">When</span>
                <strong>{detailSession.dayLabel}</strong>
                <small>{detailSession.timeLabel}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Type</span>
                <strong>{detailSession.sessionType}</strong>
                <small>{detailSession.period}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">
                  {getDetailStatusLabel(detailSession.status)}
                </span>
                <strong>{detailSession.status}</strong>
                <small>{getStatusCopy(detailSession.status)}</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Location</span>
                <strong>{detailSession.location}</strong>
                <small>{detailSession.coachName}</small>
              </div>
            </div>

            <div className="dashboard-contact-block">
              <span className="dashboard-detail-stat__label">Session note</span>
              <p>{detailSession.note}</p>
            </div>

            <div className="dashboard-info-strip">
              <strong>{getStatusSummaryLabel(detailSession.status)}</strong>
              <p>{getStatusSummaryCopy(detailSession.status)}</p>
            </div>
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
