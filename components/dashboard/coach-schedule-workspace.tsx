"use client";

import { useDeferredValue, useState } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  coachScheduleStatusFilters,
  type CoachScheduleRecord,
  type CoachScheduleStatus,
} from "@/lib/dashboard/coach-schedule-data";

type ScheduleView = "week" | "day";

function getCoachScheduleTone(status: CoachScheduleStatus) {
  switch (status) {
    case "Ready":
      return "success";
    case "Prep":
      return "accent";
    default:
      return "neutral";
  }
}

type CoachScheduleWorkspaceProps = {
  records: CoachScheduleRecord[];
};

export function CoachScheduleWorkspace({ records }: CoachScheduleWorkspaceProps) {
  const scheduleDays = [...new Set(records.map((session) => session.dayKey))];
  const coachScheduleDayFilters = ["All days", ...scheduleDays] as const;
  const [view, setView] = useState<ScheduleView>("week");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [dayFilter, setDayFilter] =
    useState<(typeof coachScheduleDayFilters)[number]>("All days");
  const [statusFilter, setStatusFilter] =
    useState<(typeof coachScheduleStatusFilters)[number]>("All");

  const filteredSchedule = records.filter((session) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [session.title, session.location, session.note, session.rosterLabel]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesDay = dayFilter === "All days" || session.dayKey === dayFilter;
    const matchesStatus = statusFilter === "All" || session.status === statusFilter;

    return matchesSearch && matchesDay && matchesStatus;
  });

  const focusedDay =
    dayFilter === "All days" ? scheduleDays[0] ?? "Monday" : dayFilter;
  const visibleDays =
    view === "week"
      ? scheduleDays.filter((day) => (dayFilter === "All days" ? true : day === focusedDay))
      : [focusedDay];
  const hasActiveFilters =
    searchTerm.trim().length > 0 || dayFilter !== "All days" || statusFilter !== "All";
  const readySessions = filteredSchedule.filter((session) => session.status === "Ready").length;
  const prepSessions = filteredSchedule.filter((session) => session.status === "Prep").length;

  const resetFilters = () => {
    setSearchTerm("");
    setDayFilter("All days");
    setStatusFilter("All");
    setView("week");
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Coach schedule" />

      <DashboardSurfaceNote
        eyebrow="Schedule"
        title="Review your week or focus on one day."
        description="Filter the board, then scan the sessions you own."
        items={[
          `${readySessions} ready sessions.`,
          `${prepSessions} in prep.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach schedule highlights">
        <DashboardMiniStat
          label="Sessions in view"
          value={filteredSchedule.length}
          description="Current workload."
        />
        <DashboardMiniStat
          label="Ready"
          value={readySessions}
          description="Ready to run."
        />
        <DashboardMiniStat
          label="Focus mode"
          value={view === "week" ? "Week" : "Day"}
          description="Current view."
        />
      </section>

      <section className="dashboard-panel dashboard-panel--accent">
        <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Schedule rhythm</div>
              <h2>Week and day views</h2>
              <p>Your classes, private sessions, and prep.</p>
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
              Week
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
              Day
            </button>
          </div>
        </div>

        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by session, note, or location"
          summary={`${filteredSchedule.length} sessions in view`}
          isFiltered={hasActiveFilters}
          onReset={resetFilters}
          filters={
            <>
              <label className="dashboard-filter-field">
                <span>Status</span>
                <select
                  className="dashboard-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as (typeof coachScheduleStatusFilters)[number]
                    )
                  }
                >
                    {coachScheduleStatusFilters.map((filter) => (
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
                      event.target.value as (typeof coachScheduleDayFilters)[number]
                    )
                  }
                >
                    {coachScheduleDayFilters.map((filter) => (
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
            const daySessions = filteredSchedule.filter(
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
                    label={`${daySessions.length} sessions`}
                    tone={daySessions.length > 0 ? "accent" : "neutral"}
                  />
                </header>

                <div className="dashboard-schedule-day__list">
                  {daySessions.length > 0 ? (
                    daySessions.map((session) => (
                      <article key={session.id} className="dashboard-schedule-session">
                        <div className="dashboard-schedule-session__badges">
                          <DashboardStatusBadge
                            label={session.sessionType}
                            tone={session.sessionType === "Group" ? "accent" : "neutral"}
                          />
                          <DashboardStatusBadge
                            label={session.status}
                            tone={getCoachScheduleTone(session.status)}
                          />
                        </div>
                        <div className="dashboard-schedule-session__topline">
                          <strong>{session.title}</strong>
                          <span>{session.timeRange}</span>
                        </div>
                        <p>{session.note}</p>
                        <div className="dashboard-schedule-session__meta">
                          <span>{session.location}</span>
                          <span>{session.rosterLabel}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <DashboardEmptyState
                      title="No sessions here"
                      description="Try a different day or reset the filters."
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
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
