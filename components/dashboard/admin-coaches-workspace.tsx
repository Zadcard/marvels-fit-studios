"use client";

import { useDeferredValue, useState } from "react";
import { Pencil, Plus, UserRoundSearch } from "lucide-react";

import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminCoachRecords,
  adminCoachStatusFilters,
  type AdminCoachRecord,
  type AdminCoachSpecialization,
  type AdminCoachStatus,
} from "@/lib/mocks/admin-coaches";

type CoachFormState = {
  fullName: string;
  email: string;
  phone: string;
  specialization: AdminCoachSpecialization;
  status: AdminCoachStatus;
};

const specializationFilters: Array<"All" | AdminCoachSpecialization> = [
  "All",
  "Strength",
  "Conditioning",
  "Mobility",
  "Private Coaching",
];

const emptyCoachForm: CoachFormState = {
  fullName: "",
  email: "",
  phone: "",
  specialization: "Strength",
  status: "Active",
};

function getCoachTone(status: AdminCoachStatus) {
  switch (status) {
    case "Active":
      return "success";
    case "Limited":
      return "warning";
    default:
      return "neutral";
  }
}

export function AdminCoachesWorkspace() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | AdminCoachStatus>("All");
  const [specializationFilter, setSpecializationFilter] = useState<
    "All" | AdminCoachSpecialization
  >("All");
  const [selectedCoachId, setSelectedCoachId] = useState(adminCoachRecords[0]?.id ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CoachFormState>(emptyCoachForm);

  const filteredCoaches = adminCoachRecords.filter((coach) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [coach.fullName, coach.email, coach.specialization, coach.summary]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus =
      statusFilter === "All" || coach.status === statusFilter;
    const matchesSpecialization =
      specializationFilter === "All" ||
      coach.specialization === specializationFilter;

    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  const selectedCoach =
    filteredCoaches.find((coach) => coach.id === selectedCoachId) ??
    filteredCoaches[0];

  const openAddModal = () => {
    setEditingCoachId(null);
    setFormState(emptyCoachForm);
    setIsModalOpen(true);
  };

  const openEditModal = (coach: AdminCoachRecord) => {
    setEditingCoachId(coach.id);
    setFormState({
      fullName: coach.fullName,
      email: coach.email,
      phone: coach.phone,
      specialization: coach.specialization,
      status: coach.status,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin coaches"
        title="Coaches Management"
        description="Track staff availability, client load, and schedule density with a layout that can grow into a richer coach operations surface later."
        actions={
          <button type="button" className="mv-btn mv-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Coach
          </button>
        }
      />

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by coach, specialty, or note"
            summary={`${filteredCoaches.length} coach records in view`}
            filters={
              <>
                <label className="dashboard-filter-field">
                  <span>Status</span>
                  <select
                    className="dashboard-select"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "All" | AdminCoachStatus)
                    }
                  >
                    {adminCoachStatusFilters.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Specialization</span>
                  <select
                    className="dashboard-select"
                    value={specializationFilter}
                    onChange={(event) =>
                      setSpecializationFilter(
                        event.target.value as "All" | AdminCoachSpecialization
                      )
                    }
                  >
                    {specializationFilters.map((specialization) => (
                      <option key={specialization} value={specialization}>
                        {specialization}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
          />

          <div className="dashboard-data-region">
            {filteredCoaches.length > 0 ? (
              <>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Coach</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Active clients</th>
                    <th>Sessions this week</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoaches.map((coach) => (
                    <tr key={coach.id}>
                      <td>
                        <div className="dashboard-table__identity">
                          <strong>{coach.fullName}</strong>
                          <span>{coach.email}</span>
                          <small>{coach.phone}</small>
                        </div>
                      </td>
                      <td>{coach.specialization}</td>
                      <td>
                        <DashboardStatusBadge
                          label={coach.status}
                          tone={getCoachTone(coach.status)}
                        />
                      </td>
                      <td>{coach.activeClients}</td>
                      <td>{coach.sessionsThisWeek}</td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button
                            type="button"
                            className="dashboard-inline-button"
                            onClick={() => setSelectedCoachId(coach.id)}
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            className="dashboard-inline-button"
                            onClick={() => openEditModal(coach)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dashboard-mobile-list">
              {filteredCoaches.map((coach) => (
                <article key={coach.id} className="dashboard-record-card">
                  <div className="dashboard-record-card__header">
                    <div>
                      <h3>{coach.fullName}</h3>
                      <p>{coach.specialization}</p>
                    </div>
                    <DashboardStatusBadge
                      label={coach.status}
                      tone={getCoachTone(coach.status)}
                    />
                  </div>
                  <div className="dashboard-record-card__meta">
                    <span>{coach.activeClients} active clients</span>
                    <span>{coach.sessionsThisWeek} sessions this week</span>
                  </div>
                  <p className="dashboard-record-card__note">{coach.summary}</p>
                  <div className="dashboard-row-actions">
                    <button
                      type="button"
                      className="dashboard-inline-button"
                      onClick={() => setSelectedCoachId(coach.id)}
                    >
                      Open detail
                    </button>
                    <button
                      type="button"
                      className="dashboard-inline-button"
                      onClick={() => openEditModal(coach)}
                    >
                      Edit coach
                    </button>
                  </div>
                </article>
              ))}
            </div>
              </>
            ) : (
              <DashboardEmptyState
                title="No coaches match these filters"
                description="Adjust the search, status, or specialization filters to see coach records again."
              />
            )}
          </div>
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          {selectedCoach ? (
            <>
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Coach detail</div>
              <h2>{selectedCoach.fullName}</h2>
              <p>{selectedCoach.summary}</p>
            </div>
            <UserRoundSearch size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-detail-grid">
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Specialization</span>
              <strong>{selectedCoach.specialization}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Status</span>
              <strong>{selectedCoach.status}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Active clients</span>
              <strong>{selectedCoach.activeClients}</strong>
            </div>
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Weekly sessions</span>
              <strong>{selectedCoach.sessionsThisWeek}</strong>
            </div>
          </div>

          <div className="dashboard-contact-block">
            <span className="dashboard-detail-stat__label">Contact</span>
            <p>{selectedCoach.email}</p>
            <p>{selectedCoach.phone}</p>
          </div>

          <button
            type="button"
            className="mv-btn mv-btn-secondary"
            onClick={() => openEditModal(selectedCoach)}
          >
            <Pencil size={16} />
            Edit Coach
          </button>
            </>
          ) : (
            <DashboardEmptyState
              title="Coach detail unavailable"
              description="Select a coach from the list once your filters return at least one record."
            />
          )}
        </aside>
      </section>

      <DashboardModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoachId ? "Edit coach" : "Add coach"}
        description="A frontend-only coach form that preserves the operational structure we will wire later."
        footer={
          <>
            <button type="button" className="mv-btn mv-btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="mv-btn mv-btn-primary" onClick={() => setIsModalOpen(false)}>
              {editingCoachId ? "Save mock changes" : "Create mock coach"}
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
            <span>Specialization</span>
            <select
              className="dashboard-select"
              value={formState.specialization}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  specialization: event.target.value as AdminCoachSpecialization,
                }))
              }
            >
              {specializationFilters
                .filter((specialization) => specialization !== "All")
                .map((specialization) => (
                  <option key={specialization} value={specialization}>
                    {specialization}
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
                  status: event.target.value as AdminCoachStatus,
                }))
              }
            >
              {adminCoachStatusFilters
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
