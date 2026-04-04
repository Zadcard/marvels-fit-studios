"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminClientToneByStatus,
  adminClientWorkspaceDefinition,
  type AdminClientWorkspaceFilters,
} from "@/lib/dashboard/admin-client-workspace";
import { useManagedRecords } from "@/lib/dashboard/use-managed-records";
import type { WorkspaceRowAction } from "@/lib/dashboard/workspace-definition";
import {
  type AdminClientRecord,
} from "@/lib/mocks/admin-clients";
import { adminClientRepository } from "@/lib/repositories/admin-client-repository";

export function AdminClientsWorkspace() {
  const records = adminClientRepository.list();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilterValue,
    filteredRecords,
    isModalOpen,
    setIsModalOpen,
    editingRecordId,
    formState,
    updateFormField,
    openCreateModal,
    openEditModal,
  } = useManagedRecords({
    records,
    definition: adminClientWorkspaceDefinition,
    initialFilters: {
      status: "All",
      membership: "All",
    } satisfies AdminClientWorkspaceFilters,
  });

  const getRowActions = (): WorkspaceRowAction<AdminClientRecord>[] => [
    {
      label: "Edit",
      onClick: openEditModal,
    },
    {
      label: "View",
      onClick: () => undefined,
    },
  ];

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin clients"
        title="Clients Management"
        description="Shape the active member roster, keep onboarding visible, and prepare the future CRUD flow with clean frontend-only patterns."
        actions={
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Add Client
          </button>
        }
      />

      <section className="dashboard-panel dashboard-panel--accent">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={adminClientWorkspaceDefinition.searchPlaceholder}
          summary={`${filteredRecords.length} client records in view`}
          filters={
            <>
              {adminClientWorkspaceDefinition.filters.map((filter) => (
                <label key={filter.key} className="dashboard-filter-field">
                  <span>{filter.label}</span>
                  <select
                    className="dashboard-select"
                    value={filters[filter.key]}
                    onChange={(event) =>
                      setFilterValue(filter.key, event.target.value)
                    }
                  >
                    {filter.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </>
          }
          actions={
            <button type="button" className="mv-btn mv-btn-outline">
              <SlidersHorizontal size={16} />
              Export Mock
            </button>
          }
        />

        <div className="dashboard-data-region">
          {filteredRecords.length > 0 ? (
            <>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Membership</th>
                      <th>Status</th>
                      <th>Assigned coach</th>
                      <th>Joined</th>
                      <th>Next session</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((client) => (
                      <tr key={client.id}>
                        <td>
                          <div className="dashboard-table__identity">
                            <strong>{client.fullName}</strong>
                            <span>{client.email}</span>
                            <small>{client.phone}</small>
                          </div>
                        </td>
                        <td>{client.membership}</td>
                        <td>
                          <DashboardStatusBadge
                            label={client.status}
                            tone={adminClientToneByStatus[client.status]}
                          />
                        </td>
                        <td>{client.assignedCoach}</td>
                        <td>{client.joinedDate}</td>
                        <td>{client.nextSession}</td>
                        <td>
                          <div className="dashboard-row-actions">
                            {getRowActions().map((action) => (
                              <button
                                key={action.label}
                                type="button"
                                className="dashboard-inline-button"
                                onClick={() => action.onClick(client)}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dashboard-mobile-list">
                {filteredRecords.map((client) => (
                  <article key={client.id} className="dashboard-record-card">
                    <div className="dashboard-record-card__header">
                      <div>
                        <h3>{client.fullName}</h3>
                        <p>{client.email}</p>
                      </div>
                      <DashboardStatusBadge
                        label={client.status}
                        tone={adminClientToneByStatus[client.status]}
                      />
                    </div>
                    <div className="dashboard-record-card__meta">
                      <span>{client.membership}</span>
                      <span>{client.assignedCoach}</span>
                      <span>{client.nextSession}</span>
                    </div>
                    <p className="dashboard-record-card__note">{client.progressNote}</p>
                    <div className="dashboard-row-actions">
                      {getRowActions().map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => action.onClick(client)}
                        >
                          {action.label === "Edit" ? "Edit client" : "View details"}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <DashboardEmptyState
              title="No clients match these filters"
              description="Try changing the search term, status, or membership filter to bring records back into view."
            />
          )}
        </div>
      </section>

      <DashboardModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecordId ? "Edit client" : "Add client"}
        description="This modal is frontend-only for now. It preserves the future form shape without wiring backend actions yet."
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={() => setIsModalOpen(false)}
            >
              {editingRecordId ? "Save mock changes" : "Create mock client"}
            </button>
          </>
        }
      >
        <div className="dashboard-form-grid">
          {adminClientWorkspaceDefinition.formFields.map((field) => (
            <label key={field.key} className="dashboard-form-field">
              <span>{field.label}</span>
              {field.kind === "select" ? (
                <select
                  className="dashboard-select"
                  value={formState[field.key]}
                  onChange={(event) =>
                    updateFormField(field.key, event.target.value)
                  }
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.kind}
                  className="dashboard-input"
                  value={formState[field.key]}
                  onChange={(event) =>
                    updateFormField(field.key, event.target.value)
                  }
                />
              )}
            </label>
          ))}
        </div>
      </DashboardModal>
    </div>
  );
}
