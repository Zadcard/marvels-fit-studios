"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, UserRoundSearch } from "lucide-react";

import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  type AdminCoachRecord,
  type AdminCoachSpecialization,
} from "@/lib/mocks/admin-coaches";

type CoachFormState = {
  fullName: string;
  email: string;
  phone: string;
  specialization: AdminCoachSpecialization;
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
};

type AdminCoachesWorkspaceProps = {
  records: AdminCoachRecord[];
};

export function AdminCoachesWorkspace({
  records,
}: AdminCoachesWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [specializationFilter, setSpecializationFilter] = useState<
    "All" | AdminCoachSpecialization
  >("All");
  const [selectedCoachId, setSelectedCoachId] = useState(records[0]?.id ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CoachFormState>(emptyCoachForm);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredCoaches = records.filter((coach) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [coach.fullName, coach.email, coach.specialization, coach.summary]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesSpecialization =
      specializationFilter === "All" ||
      coach.specialization === specializationFilter;

    return matchesSearch && matchesSpecialization;
  });

  const selectedCoach =
    filteredCoaches.find((coach) => coach.id === selectedCoachId) ??
    filteredCoaches[0];

  const openAddModal = () => {
    setEditingCoachId(null);
    setErrorMessage("");
    setFormState(emptyCoachForm);
    setIsModalOpen(true);
  };

  const openEditModal = (coach: AdminCoachRecord) => {
    setEditingCoachId(coach.id);
    setErrorMessage("");
    setFormState({
      fullName: coach.fullName,
      email: coach.email,
      phone: coach.phone,
      specialization: coach.specialization,
    });
    setIsModalOpen(true);
  };

  const handleSaveCoach = () => {
    setErrorMessage("");

    startTransition(async () => {
      try {
        await saveCoach({
          coachId: editingCoachId,
          fullName: formState.fullName,
          email: formState.email,
          phone: formState.phone,
          specialization: formState.specialization,
        });
        setIsModalOpen(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save coach."
        );
      }
    });
  };

  const handleDeleteCoach = () => {
    if (!editingCoachId) {
      return;
    }

    setErrorMessage("");

    startDeleteTransition(async () => {
      try {
        await deleteCoach({
          coachId: editingCoachId,
          confirmationText: deleteConfirmationText,
        });
        setIsDeleteModalOpen(false);
        setIsModalOpen(false);
        setDeleteConfirmationText("");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not delete coach."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Admin coaches"
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
                        {coach.activeClients}
                      </td>
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
                description="Try a different search or reset the filters."
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
                  <p>{selectedCoach.specialization}</p>
            </div>
            <UserRoundSearch size={20} color="#ff8b8f" />
          </div>

          <div className="dashboard-detail-grid">
            <div className="dashboard-detail-stat">
              <span className="dashboard-detail-stat__label">Specialization</span>
              <strong>{selectedCoach.specialization}</strong>
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
              description="Select a coach to review details."
            />
          )}
        </aside>
      </section>

      <DashboardModal
        open={isModalOpen}
        onClose={() => {
          setErrorMessage("");
          setIsModalOpen(false);
        }}
        title={editingCoachId ? "Edit coach" : "Add coach"}
        description="Coach details"
        footer={
          <>
            {editingCoachId ? (
              <button
                type="button"
                className="mv-btn mv-btn-danger"
                onClick={() => {
                  setErrorMessage("");
                  setDeleteConfirmationText("");
                  setIsDeleteModalOpen(true);
                }}
                disabled={isSaving || isDeleting}
              >
                Delete coach
              </button>
            ) : null}
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => {
                setErrorMessage("");
                setIsModalOpen(false);
              }}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={handleSaveCoach}
              disabled={isSaving || isDeleting}
            >
              {isSaving
                ? "Saving..."
                : editingCoachId
                  ? "Save coach"
                  : "Create coach"}
            </button>
          </>
        }
      >
        {errorMessage ? (
          <div className="dashboard-empty-state" role="alert">
            <strong>Could not save coach</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}
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
        </div>
      </DashboardModal>

      <DashboardModal
        open={isDeleteModalOpen}
        onClose={() => {
          if (isDeleting) {
            return;
          }

          setErrorMessage("");
          setDeleteConfirmationText("");
          setIsDeleteModalOpen(false);
        }}
        title="Delete coach"
        description='Type "Delete" to confirm coach deletion'
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => {
                setErrorMessage("");
                setDeleteConfirmationText("");
                setIsDeleteModalOpen(false);
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-danger"
              onClick={handleDeleteCoach}
              disabled={isDeleting || deleteConfirmationText.trim() !== "Delete"}
            >
              {isDeleting ? "Deleting..." : "Delete coach"}
            </button>
          </>
        }
      >
        {errorMessage ? (
          <div className="dashboard-empty-state" role="alert">
            <strong>Could not delete coach</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}
        <div className="dashboard-form-grid">
          <label className="dashboard-form-field dashboard-form-field--wide">
            <span>Confirmation</span>
            <input
              className="dashboard-input"
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              placeholder='Type "Delete" to confirm coach deletion'
            />
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}
