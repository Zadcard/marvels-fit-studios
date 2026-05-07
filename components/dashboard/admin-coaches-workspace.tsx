"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";

import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
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

type CoachSort = "name-asc" | "name-desc" | "load-desc" | "sessions-asc";

const coachSortOptions: Array<{ label: string; value: CoachSort }> = [
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Highest load", value: "load-desc" },
  { label: "Fewest sessions", value: "sessions-asc" },
];

function getCoachLoadTone(coach: AdminCoachRecord) {
  if (coach.sessionsThisWeek === 0) {
    return "warning";
  }

  if (coach.activeClients >= 20 || coach.sessionsThisWeek >= 10) {
    return "accent";
  }

  return "success";
}

function getCoachLoadLabel(coach: AdminCoachRecord) {
  if (coach.sessionsThisWeek === 0) {
    return "Needs schedule";
  }

  if (coach.activeClients >= 20 || coach.sessionsThisWeek >= 10) {
    return "High load";
  }

  return "On track";
}

type AdminCoachesWorkspaceProps = {
  records: AdminCoachRecord[];
};

export function AdminCoachesWorkspace({ records }: AdminCoachesWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [specializationFilter, setSpecializationFilter] = useState<
    "All" | AdminCoachSpecialization
  >("All");
  const [sortOrder, setSortOrder] = useState<CoachSort>("name-asc");
  const [page, setPage] = useState(1);
  const [selectedCoachId, setSelectedCoachId] = useState(records[0]?.id ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CoachFormState>(emptyCoachForm);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [detailCoachId, setDetailCoachId] = useState<string | null>(null);

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
  const sortedCoaches = useMemo(() => {
    return [...filteredCoaches].sort((left, right) => {
      if (sortOrder === "name-desc") {
        return right.fullName.localeCompare(left.fullName);
      }

      if (sortOrder === "load-desc") {
        return (
          right.activeClients + right.sessionsThisWeek -
          (left.activeClients + left.sessionsThisWeek)
        );
      }

      if (sortOrder === "sessions-asc") {
        return left.sessionsThisWeek - right.sessionsThisWeek;
      }

      return left.fullName.localeCompare(right.fullName);
    });
  }, [filteredCoaches, sortOrder]);
  const paginatedCoaches = paginateDashboardItems(sortedCoaches, page);

  const selectedCoach =
    filteredCoaches.find((coach) => coach.id === selectedCoachId) ??
    filteredCoaches[0];
  const detailCoach =
    filteredCoaches.find((coach) => coach.id === detailCoachId) ?? null;
  const highLoadCount = filteredCoaches.filter(
    (coach) => coach.activeClients >= 20 || coach.sessionsThisWeek >= 10
  ).length;
  const noSessionsCount = filteredCoaches.filter(
    (coach) => coach.sessionsThisWeek === 0
  ).length;
  const activeCoverage = filteredCoaches.reduce(
    (total, coach) => total + coach.activeClients,
    0
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, specializationFilter, sortOrder]);

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

  const openCoachDetail = (coachId: string) => {
    setSelectedCoachId(coachId);
    setDetailCoachId(coachId);
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
    <div className="dashboard-stack dashboard-stack--dense">
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
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by coach, specialty, or note"
            searchSuggestions={records.map((coach) => ({
              label: coach.fullName,
              value: coach.fullName,
              detail: `${coach.specialization} - ${coach.email}`,
            }))}
            summary={`${filteredCoaches.length} coaches in view • ${noSessionsCount} need schedule coverage`}
            sortValue={sortOrder}
            sortOptions={coachSortOptions}
            onSortChange={(value) => setSortOrder(value as CoachSort)}
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
                <div className="dashboard-panel__meta-strip">
                  <span>{highLoadCount} high load</span>
                  <span>{noSessionsCount} no sessions</span>
                  <span>{activeCoverage} active clients covered</span>
                </div>

                <div className="dashboard-table-wrap">
                  <table className="dashboard-table dashboard-coach-table">
                    <thead>
                      <tr>
                        <th>Coach</th>
                        <th>Coverage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCoaches.items.map((coach) => (
                        <tr key={coach.id}>
                          <td>
                            <div className="dashboard-table__identity">
                              <strong>{coach.fullName}</strong>
                              <span>{coach.email}</span>
                              <small>{coach.phone}</small>
                            </div>
                            <div className="dashboard-coach-table__specialization">
                              <DashboardStatusBadge
                                label={coach.specialization}
                                tone="neutral"
                              />
                              <DashboardStatusBadge
                                label={getCoachLoadLabel(coach)}
                                tone={getCoachLoadTone(coach)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="dashboard-coach-table__load">
                              <div className="dashboard-coach-table__metric">
                                <strong>{coach.activeClients}</strong>
                                <span>active clients</span>
                              </div>
                              <div className="dashboard-coach-table__metric">
                                <strong>{coach.sessionsThisWeek}</strong>
                                <span>sessions this week</span>
                              </div>
                              <div className="dashboard-badge-stack">
                                {coach.conflicts > 0 ? (
                                  <DashboardStatusBadge
                                    label={`${coach.conflicts} conflicts`}
                                    tone="warning"
                                  />
                                ) : (
                                  <DashboardStatusBadge label="No conflicts" tone="success" />
                                )}
                                <DashboardStatusBadge
                                  label={`${coach.openSlots} open`}
                                  tone={coach.openSlots < 3 ? "accent" : "neutral"}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="dashboard-row-actions">
                              <button
                                type="button"
                                className="dashboard-inline-button"
                                onClick={() => openCoachDetail(coach.id)}
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
                  {paginatedCoaches.items.map((coach) => (
                    <article
                      key={coach.id}
                      className="dashboard-record-card dashboard-record-card--coach"
                    >
                      <div className="dashboard-record-card__header">
                        <div>
                          <span className="dashboard-record-card__eyebrow">
                            {coach.specialization}
                          </span>
                          <h3>{coach.fullName}</h3>
                          <p>{coach.email}</p>
                        </div>
                        <DashboardStatusBadge
                          label={getCoachLoadLabel(coach)}
                          tone={getCoachLoadTone(coach)}
                        />
                      </div>
                      <div className="dashboard-record-card__meta">
                        <span>{coach.activeClients} active clients</span>
                        <span>{coach.sessionsThisWeek} sessions this week</span>
                        <span>{coach.openSlots} open slots</span>
                      </div>
                      {coach.conflicts > 0 ? (
                        <div className="dashboard-badge-stack">
                          <DashboardStatusBadge
                            label={`${coach.conflicts} conflicts`}
                            tone="warning"
                          />
                        </div>
                      ) : null}
                      <p className="dashboard-record-card__note">{coach.summary}</p>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => openCoachDetail(coach.id)}
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
          <DashboardPaginationControls
            page={paginatedCoaches.page}
            pageCount={paginatedCoaches.pageCount}
            startItem={paginatedCoaches.startItem}
            endItem={paginatedCoaches.endItem}
            totalItems={paginatedCoaches.totalItems}
            onPageChange={setPage}
          />
        </article>

        <aside className="dashboard-panel dashboard-detail-panel dashboard-panel--dense">
          {selectedCoach ? (
            <>
              <div className="dashboard-panel__header dashboard-panel__header--tight">
                <div>
                  <div className="mv-eyebrow">Coach detail</div>
                  <h2>{selectedCoach.fullName}</h2>
                  <p>{selectedCoach.summary}</p>
                </div>
                <DashboardStatusBadge
                  label={getCoachLoadLabel(selectedCoach)}
                  tone={getCoachLoadTone(selectedCoach)}
                />
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
                  <small>{selectedCoach.openSlots} open slots</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Conflicts</span>
                  <strong>{selectedCoach.conflicts}</strong>
                  {selectedCoach.conflicts > 0 ? (
                    <DashboardStatusBadge
                      label={`${selectedCoach.conflicts} conflicts`}
                      tone="warning"
                    />
                  ) : (
                    <DashboardStatusBadge label="Clear" tone="success" />
                  )}
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Contact</span>
                <p>{selectedCoach.email}</p>
                <p>{selectedCoach.phone}</p>
              </div>

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">Weekly load</div>
                    <h3>Sessions by day</h3>
                    <p>Quick load pattern before assigning another session.</p>
                  </div>
                </div>
                <div className="dashboard-panel__meta-strip">
                  {selectedCoach.weeklyLoad.map((day) => (
                    <span key={day.day}>
                      {day.day}: {day.sessions}
                    </span>
                  ))}
                </div>
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
        open={!!detailCoach}
        onClose={() => setDetailCoachId(null)}
        title={detailCoach?.fullName ?? "Coach details"}
        description={detailCoach?.summary}
        size="wide"
        footer={
          detailCoach ? (
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={() => {
                setDetailCoachId(null);
                openEditModal(detailCoach);
              }}
            >
              <Pencil size={16} />
              Edit Coach
            </button>
          ) : null
        }
      >
        {detailCoach ? (
          <div className="dashboard-stack">
            <div className="dashboard-detail-grid">
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Specialization</span>
                <strong>{detailCoach.specialization}</strong>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Active clients</span>
                <strong>{detailCoach.activeClients}</strong>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Weekly sessions</span>
                <strong>{detailCoach.sessionsThisWeek}</strong>
                <small>{detailCoach.openSlots} open slots</small>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Conflicts</span>
                <strong>{detailCoach.conflicts}</strong>
                <small>{getCoachLoadLabel(detailCoach)}</small>
              </div>
            </div>

            <div className="dashboard-contact-block">
              <span className="dashboard-detail-stat__label">Contact</span>
              <p>{detailCoach.email}</p>
              <p>{detailCoach.phone}</p>
            </div>

            <div className="dashboard-summary-list">
              {detailCoach.weeklyLoad.map((day) => (
                <div key={day.day} className="dashboard-summary-row">
                  <strong>{day.day}</strong>
                  <span>{day.sessions} sessions</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DashboardModal>

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
