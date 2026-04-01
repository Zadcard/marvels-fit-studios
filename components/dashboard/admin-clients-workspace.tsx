"use client";

import { useDeferredValue, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminClientMembershipFilters,
  adminClientRecords,
  adminClientStatusFilters,
  type AdminClientMembership,
  type AdminClientRecord,
  type AdminClientStatus,
} from "@/lib/mocks/admin-clients";

type ClientFormState = {
  fullName: string;
  email: string;
  phone: string;
  membership: AdminClientMembership;
  status: AdminClientStatus;
  assignedCoach: string;
};

const emptyClientForm: ClientFormState = {
  fullName: "",
  email: "",
  phone: "",
  membership: "Group Membership",
  status: "Pending",
  assignedCoach: "Unassigned",
};

function getClientTone(status: AdminClientStatus) {
  switch (status) {
    case "Active":
      return "success";
    case "Pending":
      return "warning";
    default:
      return "neutral";
  }
}

export function AdminClientsWorkspace() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | AdminClientStatus>("All");
  const [membershipFilter, setMembershipFilter] = useState<
    "All" | AdminClientMembership
  >("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ClientFormState>(emptyClientForm);

  const filteredClients = adminClientRecords.filter((client) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [client.fullName, client.email, client.assignedCoach, client.membership]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;
    const matchesMembership =
      membershipFilter === "All" || client.membership === membershipFilter;

    return matchesSearch && matchesStatus && matchesMembership;
  });

  const openAddModal = () => {
    setEditingClientId(null);
    setFormState(emptyClientForm);
    setIsModalOpen(true);
  };

  const openEditModal = (client: AdminClientRecord) => {
    setEditingClientId(client.id);
    setFormState({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      membership: client.membership,
      status: client.status,
      assignedCoach: client.assignedCoach,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin clients"
        title="Clients Management"
        description="Shape the active member roster, keep onboarding visible, and prepare the future CRUD flow with clean frontend-only patterns."
        actions={
          <button type="button" className="mv-btn mv-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Client
          </button>
        }
      />

      <section className="dashboard-panel dashboard-panel--accent">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by client, coach, or membership"
          summary={`${filteredClients.length} client records in view`}
          filters={
            <>
              <label className="dashboard-filter-field">
                <span>Status</span>
                <select
                  className="dashboard-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "All" | AdminClientStatus)
                  }
                >
                  {adminClientStatusFilters.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-filter-field">
                <span>Membership</span>
                <select
                  className="dashboard-select"
                  value={membershipFilter}
                  onChange={(event) =>
                    setMembershipFilter(
                      event.target.value as "All" | AdminClientMembership
                    )
                  }
                >
                  {adminClientMembershipFilters.map((membership) => (
                    <option key={membership} value={membership}>
                      {membership}
                    </option>
                  ))}
                </select>
              </label>
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
          {filteredClients.length > 0 ? (
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
                {filteredClients.map((client) => (
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
                        tone={getClientTone(client.status)}
                      />
                    </td>
                    <td>{client.assignedCoach}</td>
                    <td>{client.joinedDate}</td>
                    <td>{client.nextSession}</td>
                    <td>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => openEditModal(client)}
                        >
                          Edit
                        </button>
                        <button type="button" className="dashboard-inline-button">
                          View
                        </button>
                      </div>
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
                    <p>{client.email}</p>
                  </div>
                  <DashboardStatusBadge
                    label={client.status}
                    tone={getClientTone(client.status)}
                  />
                </div>
                <div className="dashboard-record-card__meta">
                  <span>{client.membership}</span>
                  <span>{client.assignedCoach}</span>
                  <span>{client.nextSession}</span>
                </div>
                <p className="dashboard-record-card__note">{client.progressNote}</p>
                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={() => openEditModal(client)}
                  >
                    Edit client
                  </button>
                  <button type="button" className="dashboard-inline-button">
                    View details
                  </button>
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
        title={editingClientId ? "Edit client" : "Add client"}
        description="This modal is frontend-only for now. It preserves the future form shape without wiring backend actions yet."
        footer={
          <>
            <button type="button" className="mv-btn mv-btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={() => setIsModalOpen(false)}>
              {editingClientId ? "Save mock changes" : "Create mock client"}
            </button>
          </>
        }
      >
        <div className="dashboard-form-grid">
          <label className="dashboard-form-field">
            <span>Full name</span>
            <input
              className="dashboard-input"
              value={formState.fullName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Email</span>
            <input
              className="dashboard-input"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Phone</span>
            <input
              className="dashboard-input"
              value={formState.phone}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Assigned coach</span>
            <input
              className="dashboard-input"
              value={formState.assignedCoach}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  assignedCoach: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Membership</span>
            <select
              className="dashboard-select"
              value={formState.membership}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  membership: event.target.value as AdminClientMembership,
                }))
              }
            >
              {adminClientMembershipFilters
                .filter((membership) => membership !== "All")
                .map((membership) => (
                  <option key={membership} value={membership}>
                    {membership}
                  </option>
                ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Status</span>
            <select
              className="dashboard-select"
              value={formState.status}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  status: event.target.value as AdminClientStatus,
                }))
              }
            >
              {adminClientStatusFilters
                .filter((status) => status !== "All")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}
