"use client";

import { useDeferredValue, useState } from "react";
import { CalendarPlus2, LayoutGrid, Rows3 } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminScheduleDayFilters,
  adminScheduleSessionRecords,
  adminScheduleSessionTypeFilters,
  adminScheduleStats,
  adminScheduleStatusFilters,
  type AdminScheduleSessionStatus,
  type AdminScheduleSessionType,
} from "@/lib/mocks/admin-schedule";

type ScheduleView = "week" | "day";
type ScheduleDraftState = {
  title: string;
  sessionType: AdminScheduleSessionType;
  dayLabel: string;
  timeRange: string;
  coachName: string;
};

const scheduleDays = adminScheduleDayFilters.filter(
  (day): day is Exclude<(typeof adminScheduleDayFilters)[number], "All days"> =>
    day !== "All days"
);

const emptyScheduleDraft: ScheduleDraftState = {
  title: "",
  sessionType: "Group",
  dayLabel: "Monday",
  timeRange: "",
  coachName: "",
};

function getScheduleTone(status: AdminScheduleSessionStatus) {
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

function getSessionTypeTone(type: AdminScheduleSessionType) {
  return type === "Group" ? "accent" : "neutral";
}

export function AdminScheduleWorkspace() {
  const [view, setView] = useState<ScheduleView>("week");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [dayFilter, setDayFilter] =
    useState<(typeof adminScheduleDayFilters)[number]>("All days");
  const [statusFilter, setStatusFilter] =
    useState<(typeof adminScheduleStatusFilters)[number]>("All statuses");
  const [sessionTypeFilter, setSessionTypeFilter] =
    useState<(typeof adminScheduleSessionTypeFilters)[number]>("All types");
  const [selectedSessionId, setSelectedSessionId] = useState(
    adminScheduleSessionRecords[0]?.id ?? ""
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draftState, setDraftState] = useState<ScheduleDraftState>(
    emptyScheduleDraft
  );

  const filteredSessions = adminScheduleSessionRecords.filter((session) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [
        session.title,
        session.dayLabel,
        session.coachName,
        session.location,
        session.focus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesDay = dayFilter === "All days" || session.dayKey === dayFilter;
    const matchesStatus =
      statusFilter === "All statuses" || session.status === statusFilter;
    const matchesType =
      sessionTypeFilter === "All types" ||
      session.sessionType === sessionTypeFilter;

    return matchesSearch && matchesDay && matchesStatus && matchesType;
  });

  const focusedDay =
    dayFilter === "All days" ? scheduleDays[0] ?? "Monday" : dayFilter;

  const visibleDays =
    view === "week"
      ? scheduleDays.filter((day) =>
          dayFilter === "All days" ? true : day === focusedDay
        )
      : [focusedDay];

  const selectedSession =
    filteredSessions.find((session) => session.id === selectedSessionId) ??
    filteredSessions[0] ??
    adminScheduleSessionRecords[0];

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin schedule"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => {
              setDraftState(emptyScheduleDraft);
              setIsCreateModalOpen(true);
            }}
          >
            <CalendarPlus2 size={16} />
            Create Block
          </button>
        }
      />

      <section className="dashboard-kpi-grid">
        {adminScheduleStats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-panel__header">
          <div>
            <span className="mv-eyebrow">Weekly board</span>
            <h2>Session rhythm by day</h2>
            <p>Staffing, occupancy, and timing by day.</p>
          </div>

          <div className="dashboard-segmented">
            <button
              type="button"
              className={
                view === "week"
                  ? "dashboard-segmented__button dashboard-segmented__button--active"
                  : "dashboard-segmented__button"
              }
              onClick={() => setView("week")}
            >
              <LayoutGrid size={14} />
              Week board
            </button>
            <button
              type="button"
              className={
                view === "day"
                  ? "dashboard-segmented__button dashboard-segmented__button--active"
                  : "dashboard-segmented__button"
              }
              onClick={() => setView("day")}
            >
              <Rows3 size={14} />
              Focus day
            </button>
          </div>
        </div>

        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by session, coach, focus, or location"
          summary={`${filteredSessions.length} sessions matching the current view`}
          filters={
            <>
              <label className="dashboard-filter-field">
                <span>Type</span>
                <select
                  className="dashboard-select"
                  value={sessionTypeFilter}
                  onChange={(event) =>
                    setSessionTypeFilter(
                      event.target.value as (typeof adminScheduleSessionTypeFilters)[number]
                    )
                  }
                >
                  {adminScheduleSessionTypeFilters.map((filter) => (
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
                    setStatusFilter(
                      event.target.value as (typeof adminScheduleStatusFilters)[number]
                    )
                  }
                >
                  {adminScheduleStatusFilters.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-filter-field">
                <span>Day</span>
                <select
                  className="dashboard-select"
                  value={dayFilter}
                  onChange={(event) =>
                    setDayFilter(
                      event.target.value as (typeof adminScheduleDayFilters)[number]
                    )
                  }
                >
                  {adminScheduleDayFilters.map((filter) => (
                    <option key={filter} value={filter}>
                      {filter}
                    </option>
                  ))}
                </select>
              </label>
            </>
          }
        />

        <div className="dashboard-day-picker">
          {scheduleDays.map((day) => (
            <button
              key={day}
              type="button"
              className={
                focusedDay === day
                  ? "dashboard-day-chip dashboard-day-chip--active"
                  : "dashboard-day-chip"
              }
              onClick={() => {
                setDayFilter(day);
                setView("day");
              }}
            >
              {day}
            </button>
          ))}
        </div>

        <div
          className={
            view === "week"
              ? "dashboard-schedule-board"
              : "dashboard-schedule-board dashboard-schedule-board--single"
          }
        >
          {visibleDays.map((day) => {
            const daySessions = filteredSessions.filter(
              (session) => session.dayKey === day
            );

            return (
              <section key={day} className="dashboard-schedule-day">
                <header className="dashboard-schedule-day__header">
                  <div>
                    <span className="mv-eyebrow">{day}</span>
                    <h3>{daySessions[0]?.dateLabel ?? "Upcoming"}</h3>
                  </div>
                  <DashboardStatusBadge
                    label={`${daySessions.length} blocks`}
                    tone={daySessions.length > 0 ? "accent" : "neutral"}
                  />
                </header>

                <div className="dashboard-schedule-day__list">
                  {daySessions.length > 0 ? (
                    daySessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        className={
                          selectedSessionId === session.id
                            ? "dashboard-schedule-session dashboard-schedule-session--active"
                            : "dashboard-schedule-session"
                        }
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="dashboard-schedule-session__badges">
                          <DashboardStatusBadge
                            label={session.sessionType}
                            tone={getSessionTypeTone(session.sessionType)}
                          />
                          <DashboardStatusBadge
                            label={session.status}
                            tone={getScheduleTone(session.status)}
                          />
                        </div>
                        <div className="dashboard-schedule-session__topline">
                          <strong>{session.title}</strong>
                          <span>{session.timeRange}</span>
                        </div>
                        <p>{session.focus}</p>
                        <div className="dashboard-schedule-session__meta">
                          <span>{session.coachName}</span>
                          <span>{session.location}</span>
                          <span>{session.occupancyLabel}</span>
                        </div>
                        <small>{session.highlight}</small>
                      </button>
                    ))
                  ) : (
                    <div className="dashboard-empty-state">
                      <strong>No sessions in this slice</strong>
                      <p>Adjust the filters to bring sessions back into view.</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <span className="mv-eyebrow">Selected block</span>
              <h2>{selectedSession.title}</h2>
              <p>{selectedSession.highlight}</p>
            </div>
          </div>

          <div className="dashboard-detail-grid">
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Coach</span>
              <strong>{selectedSession.coachName}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Timing</span>
              <strong>{selectedSession.timeRange}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Location</span>
              <strong>{selectedSession.location}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Occupancy</span>
              <strong>{selectedSession.occupancyLabel}</strong>
            </div>
          </div>

          <div className="dashboard-contact-block">
            <span className="dashboard-detail-stat__label">Admin note</span>
            <p>{selectedSession.focus}</p>
            <p>{selectedSession.attendanceNote}</p>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <span className="mv-eyebrow">Planning cues</span>
              <h2>What to watch next</h2>
              <p>Short operational notes for the next schedule decisions.</p>
            </div>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <strong>Waitlist pressure</strong>
              <span>Conditioning Lab is full and may need an overflow block.</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Soft demand</strong>
              <span>Mobility Flow needs a small push before Tuesday evening.</span>
            </div>
            <div className="dashboard-summary-row">
              <strong>Private follow-up</strong>
              <span>Friday&apos;s return-to-training session still needs confirmation.</span>
            </div>
          </div>
        </article>
      </section>

      <DashboardModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create schedule block"
        description="Schedule block details"
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Save block
            </button>
          </>
        }
      >
        <div className="dashboard-form-grid">
          <label className="dashboard-form-field">
            <span>Title</span>
            <input
              className="dashboard-input"
              value={draftState.title}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Session type</span>
            <select
              className="dashboard-select"
              value={draftState.sessionType}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  sessionType: event.target.value as AdminScheduleSessionType,
                }))
              }
            >
              {adminScheduleSessionTypeFilters
                .filter((filter) => filter !== "All types")
                .map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Day</span>
            <select
              className="dashboard-select"
              value={draftState.dayLabel}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  dayLabel: event.target.value,
                }))
              }
            >
              {scheduleDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Time range</span>
            <input
              className="dashboard-input"
              value={draftState.timeRange}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  timeRange: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Coach</span>
            <input
              className="dashboard-input"
              value={draftState.coachName}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  coachName: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}
