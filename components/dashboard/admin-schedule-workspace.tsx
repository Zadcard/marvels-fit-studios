"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { CalendarPlus2, LayoutGrid, Rows3 } from "lucide-react";
import { useRouter } from "next/navigation";

import { saveAdminSession } from "@/app/actions/admin-sessions";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { CoachOptionPicker } from "@/components/dashboard/coach-option-picker";
import { SessionTypePicker } from "@/components/dashboard/session-type-picker";
import type {
  AdminScheduleSessionRecord,
  AdminScheduleSessionStatus,
  AdminScheduleSessionType,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import {
  adminScheduleDayFilters,
  adminScheduleSessionTypeFilters,
  adminScheduleStatusFilters,
} from "@/lib/dashboard/admin-schedule-data";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";

type ScheduleView = "week" | "day";
type ScheduleDraftState = {
  title: string;
  sessionType: "GROUP" | "PRIVATE";
  status: "SCHEDULED" | "DRAFT";
  startsAt: string;
  endsAt: string;
  coachId: string;
  location: string;
  capacity: string;
  description: string;
};

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

function createDefaultDraft(coachId: string): ScheduleDraftState {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    title: "",
    sessionType: "GROUP",
    status: "SCHEDULED",
    startsAt: toDateTimeLocalValue(start.toISOString()),
    endsAt: toDateTimeLocalValue(end.toISOString()),
    coachId,
    location: "",
    capacity: "12",
    description: "",
  };
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

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

type AdminScheduleWorkspaceProps = {
  stats: AdminScheduleStat[];
  records: AdminScheduleSessionRecord[];
  coachOptions: AdminSessionCoachOption[];
};

export function AdminScheduleWorkspace({
  stats,
  records,
  coachOptions,
}: AdminScheduleWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [view, setView] = useState<ScheduleView>("week");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [dayFilter, setDayFilter] =
    useState<(typeof adminScheduleDayFilters)[number]>("All days");
  const [statusFilter, setStatusFilter] =
    useState<(typeof adminScheduleStatusFilters)[number]>("All statuses");
  const [sessionTypeFilter, setSessionTypeFilter] =
    useState<(typeof adminScheduleSessionTypeFilters)[number]>("All types");
  const [selectedSessionId, setSelectedSessionId] = useState(records[0]?.id ?? "");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draftState, setDraftState] = useState<ScheduleDraftState>(
    createDefaultDraft(coachOptions[0]?.id ?? "")
  );
  const [errorMessage, setErrorMessage] = useState("");

  const scheduleDays = useMemo(
    () =>
      adminScheduleDayFilters.filter(
        (day): day is Exclude<(typeof adminScheduleDayFilters)[number], "All days"> =>
          day !== "All days"
      ),
    []
  );

  const filteredSessions = records.filter((session) => {
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
      ? scheduleDays.filter((day) => (dayFilter === "All days" ? true : day === focusedDay))
      : [focusedDay];

  const selectedSession =
    filteredSessions.find((session) => session.id === selectedSessionId) ??
    filteredSessions[0] ??
    records[0];

  const handleCreateSession = () => {
    setErrorMessage("");

    startSaveTransition(async () => {
      try {
        await saveAdminSession({
          title: draftState.title,
          description: draftState.description,
          type: draftState.sessionType,
          status: draftState.status,
          coachId: draftState.coachId,
          location: draftState.location,
          startsAt: toIsoDateTime(draftState.startsAt),
          endsAt: toIsoDateTime(draftState.endsAt),
          capacity:
            draftState.sessionType === "PRIVATE"
              ? 1
              : draftState.capacity.trim() === ""
                ? null
                : Number(draftState.capacity),
        });
        setIsCreateModalOpen(false);
        setDraftState(createDefaultDraft(coachOptions[0]?.id ?? ""));
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not create session."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin schedule"
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={() => {
              setDraftState(createDefaultDraft(coachOptions[0]?.id ?? ""));
              setErrorMessage("");
              setIsCreateModalOpen(true);
            }}
          >
            <CalendarPlus2 size={16} />
            Create Block
          </button>
        }
      />

      <section className="dashboard-kpi-grid">
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            detail={stat.detail}
            note={stat.note}
            icon={stat.icon}
            tone={stat.tone}
          />
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
            const daySessions = filteredSessions.filter((session) => session.dayKey === day);

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

      {selectedSession ? (
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
        </section>
      ) : null}

      <DashboardModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create schedule block"
        description="This saves a real session to the database."
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={handleCreateSession}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save block"}
            </button>
          </>
        }
      >
        {errorMessage ? (
          <div className="dashboard-empty-state" role="alert">
            <strong>Could not create session</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}
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
            <SessionTypePicker
              value={draftState.sessionType}
              onChange={(nextType) =>
                setDraftState((current) => ({
                  ...current,
                  sessionType: nextType,
                  capacity: nextType === "PRIVATE" ? "1" : current.capacity || "12",
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Status</span>
            <select
              className="dashboard-select"
              value={draftState.status}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  status: event.target.value as "SCHEDULED" | "DRAFT",
                }))
              }
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="DRAFT">Draft</option>
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Starts at</span>
            <input
              type="datetime-local"
              className="dashboard-input"
              value={draftState.startsAt}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  startsAt: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Ends at</span>
            <input
              type="datetime-local"
              className="dashboard-input"
              value={draftState.endsAt}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  endsAt: event.target.value,
                }))
              }
            />
          </label>
          <div className="dashboard-form-field dashboard-form-field--wide">
            <span>Coach</span>
            <CoachOptionPicker
              value={draftState.coachId}
              onChange={(coachId) =>
                setDraftState((current) => ({
                  ...current,
                  coachId,
                }))
              }
              options={coachOptions}
            />
          </div>
          <label className="dashboard-form-field">
            <span>Location</span>
            <input
              className="dashboard-input"
              value={draftState.location}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Capacity</span>
            <input
              type="number"
              min={1}
              max={draftState.sessionType === "PRIVATE" ? 1 : 100}
              disabled={draftState.sessionType === "PRIVATE"}
              className="dashboard-input"
              value={draftState.sessionType === "PRIVATE" ? "1" : draftState.capacity}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  capacity: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Description</span>
            <input
              className="dashboard-input"
              value={draftState.description}
              onChange={(event) =>
                setDraftState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}
