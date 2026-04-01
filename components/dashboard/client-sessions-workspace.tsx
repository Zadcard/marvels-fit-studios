"use client";

import { useDeferredValue, useState } from "react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  clientSessionPeriodFilters,
  clientSessionRecords,
  clientSessionTypeFilters,
  type ClientSessionPeriod,
  type ClientSessionStatus,
  type ClientSessionType,
} from "@/lib/mocks/client-sessions";

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

export function ClientSessionsWorkspace() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [periodFilter, setPeriodFilter] = useState<"All" | ClientSessionPeriod>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | ClientSessionType>("All");

  const filteredSessions = clientSessionRecords.filter((session) => {
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

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="My sessions"
        title="Sessions"
        description="Your upcoming and past sessions in one calm, member-friendly view."
      />

      <section className="dashboard-panel dashboard-panel--accent">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by session, coach, or location"
          summary={`${filteredSessions.length} sessions in view`}
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
                    tone={getSessionTone(session.status)}
                  />
                </div>
                <div className="dashboard-record-card__meta">
                  <span>{session.period}</span>
                  <span>{session.sessionType}</span>
                  <span>{session.location}</span>
                </div>
                <p className="dashboard-record-card__note">{session.note}</p>
              </article>
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            title="No sessions match these filters"
            description="Try changing the period or session type filter to see your booked and completed sessions again."
          />
        )}
      </section>
    </div>
  );
}
