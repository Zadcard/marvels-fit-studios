"use client";

import { useDeferredValue, useState } from "react";
import { UserRoundSearch } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
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

  const selectedClient =
    filteredClients.find((client) => client.id === selectedClientId) ??
    filteredClients[0];

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Coach clients"
        title="Assigned Clients"
        description="A focused view of your roster only, built around progress, next touchpoints, and who may need support this week."
      />

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by client, focus, or progress note"
            summary={`${filteredClients.length} assigned clients in view`}
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
                description="Adjust the search, status, or plan filter to see assigned clients again."
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
            </>
          ) : (
            <DashboardEmptyState
              title="Client detail unavailable"
              description="Select a client from the list once your current filters return at least one record."
            />
          )}
        </aside>
      </section>
    </div>
  );
}
