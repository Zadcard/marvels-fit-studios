"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { UserRoundSearch } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  coachClientPlanFilters,
  coachClientRecords,
  coachClientStatusFilters,
  type CoachClientPlan,
  type CoachClientStatus,
} from "@/lib/mocks/coach-clients";

function getCoachClientTone(status: CoachClientStatus) {
  switch (status) {
    case "On track":
      return "success";
    case "Needs check-in":
      return "warning";
    case "New this week":
      return "accent";
    default:
      return "neutral";
  }
}

function getSuggestedAction(status: CoachClientStatus) {
  switch (status) {
    case "Needs check-in":
      return "Prioritize a direct follow-up before this client loses rhythm.";
    case "Recovery focus":
      return "Keep the next touchpoint lighter and centered on recovery pacing.";
    case "New this week":
      return "Reinforce confidence and simplify the next progression cue.";
    default:
      return "Maintain momentum and log the next progress note after the next session.";
  }
}

export function CoachClientsWorkspace() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | CoachClientStatus>("All");
  const [planFilter, setPlanFilter] = useState<"All" | CoachClientPlan>("All");
  const [selectedClientId, setSelectedClientId] = useState(
    coachClientRecords[0]?.id ?? ""
  );

  const filteredClients = coachClientRecords.filter((client) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [client.fullName, client.currentFocus, client.progressNote, client.planType]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "All" || client.status === statusFilter;
    const matchesPlan = planFilter === "All" || client.planType === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  useEffect(() => {
    if (!filteredClients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(filteredClients[0]?.id ?? "");
    }
  }, [filteredClients, selectedClientId]);

  const selectedClient =
    filteredClients.find((client) => client.id === selectedClientId) ??
    filteredClients[0];
  const hasActiveFilters =
    searchTerm.trim().length > 0 || statusFilter !== "All" || planFilter !== "All";
  const needsCheckIn = filteredClients.filter(
    (client) => client.status === "Needs check-in"
  ).length;
  const activeHybrid = filteredClients.filter(
    (client) => client.planType === "Hybrid"
  ).length;

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPlanFilter("All");
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Coach clients" />

      <DashboardSurfaceNote
        eyebrow="Roster"
        title="Track your roster, progress notes, and next touchpoints here."
        description="Filter the list, then open a client for details."
        items={[
          `${needsCheckIn} need check-in.`,
          `${activeHybrid} hybrid clients.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Coach client highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Clients in view</span>
          <strong>{filteredClients.length}</strong>
          <p>Current roster view.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Needs check-in</span>
          <strong>{needsCheckIn}</strong>
          <p>Need follow-up.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Hybrid plans</span>
          <strong>{activeHybrid}</strong>
          <p>Hybrid plans.</p>
        </article>
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by client, focus, or progress note"
            summary={`${filteredClients.length} assigned clients in view`}
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
                      setStatusFilter(event.target.value as "All" | CoachClientStatus)
                    }
                  >
                    {coachClientStatusFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Plan</span>
                  <select
                    className="dashboard-select"
                    value={planFilter}
                    onChange={(event) =>
                      setPlanFilter(event.target.value as "All" | CoachClientPlan)
                    }
                  >
                    {coachClientPlanFilters.map((filter) => (
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
            {filteredClients.length > 0 ? (
              <>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Next session</th>
                        <th>Last touchpoint</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.id}>
                          <td>
                            <div className="dashboard-table__identity">
                              <strong>{client.fullName}</strong>
                              <span>{client.currentFocus}</span>
                              <small>{client.progressNote}</small>
                            </div>
                          </td>
                          <td>{client.planType}</td>
                          <td>
                            <DashboardStatusBadge
                              label={client.status}
                              tone={getCoachClientTone(client.status)}
                            />
                          </td>
                          <td>{client.nextSession}</td>
                          <td>{client.lastTouchpoint}</td>
                          <td>
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() => setSelectedClientId(client.id)}
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
                  {filteredClients.map((client) => (
                    <article key={client.id} className="dashboard-record-card">
                      <div className="dashboard-record-card__header">
                        <div>
                          <h3>{client.fullName}</h3>
                          <p>{client.planType}</p>
                        </div>
                        <DashboardStatusBadge
                          label={client.status}
                          tone={getCoachClientTone(client.status)}
                        />
                      </div>
                      <div className="dashboard-record-card__meta">
                        <span>{client.nextSession}</span>
                        <span>{client.lastTouchpoint}</span>
                      </div>
                      <p className="dashboard-record-card__note">{client.progressNote}</p>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => setSelectedClientId(client.id)}
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
                title="No clients match these filters"
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
          {selectedClient ? (
            <>
              <div className="dashboard-panel__header">
                <div>
                  <div className="mv-eyebrow">Client detail</div>
                  <h2>{selectedClient.fullName}</h2>
                  <p>{selectedClient.currentFocus}</p>
                </div>
                <UserRoundSearch size={20} color="#ff8b8f" />
              </div>

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Plan</span>
                  <strong>{selectedClient.planType}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Status</span>
                  <strong>{selectedClient.status}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Next session</span>
                  <strong>{selectedClient.nextSession}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Last touchpoint</span>
                  <strong>{selectedClient.lastTouchpoint}</strong>
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Progress note</span>
                <p>{selectedClient.progressNote}</p>
              </div>

              <div className="dashboard-info-strip">
                <strong>Suggested next move</strong>
                <p>{getSuggestedAction(selectedClient.status)}</p>
              </div>
            </>
          ) : (
            <DashboardEmptyState
              title="Client detail unavailable"
              description="Select a client to review details."
            />
          )}
        </aside>
      </section>
    </div>
  );
}
