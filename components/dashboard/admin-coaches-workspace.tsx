"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";

import { deleteCoach, saveCoach } from "@/app/actions/admin-coaches";
import { reassignAdminScheduleBlockCoach } from "@/app/actions/admin-schedule-blocks";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  type AdminCoachRecord,
  type AdminCoachSpecialization,
} from "@/lib/mocks/admin-coaches";

type CoachFormState = {
  fullName: string;
  email: string;
  phone: string;
  initialPassword: string;
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
  initialPassword: "",
  specialization: "Strength",
};

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
  blockOptions: Array<{
    id: string;
    title: string;
  }>;
};

export function AdminCoachesWorkspace({
  records,
  blockOptions,
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
  const [selectedBlockId, setSelectedBlockId] = useState(blockOptions[0]?.id ?? "");
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
      initialPassword: "",
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
          initialPassword: formState.initialPassword,
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

  const handleAssignBlock = () => {
    if (!selectedCoach || !selectedBlockId) {
      return;
    }

    setErrorMessage("");

    startTransition(async () => {
      try {
        await reassignAdminScheduleBlockCoach(selectedBlockId, selectedCoach.id);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not assign block to coach."
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

      <DashboardSurfaceNote
        eyebrow="Coach coverage"
        title={
          noSessionsCount > 0
            ? `${noSessionsCount} coaches have no sessions scheduled this week in this view.`
            : "Coach coverage is active enough to focus on load balance and specialization."
        }
        description="Scan idle coverage first, then watch high-load coaches before assigning more clients or sessions."
        items={[
          `${filteredCoaches.length} coaches are visible in this filtered roster.`,
          `${highLoadCount} coaches are carrying high client or session load.`,
          `${activeCoverage} active client assignments are covered across this view.`,
        ]}
      />

      <section
        className="dashboard-mini-grid dashboard-admin-priority-grid"
        aria-label="Coach priorities"
      >
        <DashboardMiniStat
          tone={noSessionsCount > 0 ? "warning" : "success"}
          label="No sessions"
          value={noSessionsCount}
          description="Need schedule coverage."
        />
        <DashboardMiniStat
          tone={highLoadCount > 0 ? "accent" : "success"}
          label="High load"
          value={highLoadCount}
          description="Need attention before adding more work."
        />
        <DashboardMiniStat
          tone="success"
          label="Client coverage"
          value={activeCoverage}
          description="Active clients covered in this view."
        />
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by coach, specialty, or note"
            summary={`${filteredCoaches.length} coaches in view • ${noSessionsCount} need schedule coverage`}
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
                      {filteredCoaches.map((coach) => (
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
                                <DashboardStatusBadge
                                  label={`${coach.recurringBlocks} blocks`}
                                  tone="neutral"
                                />
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
                        <span>{coach.recurringBlocks} blocks</span>
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
                  <span className="dashboard-detail-stat__label">Recurring blocks</span>
                  <strong>{selectedCoach.recurringBlocks}</strong>
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
                    <p>Quick load pattern before assigning another recurring block.</p>
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

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">Recurring blocks</div>
                    <h3>Current block assignments</h3>
                    <p>Review recurring ownership and rebalance when needed.</p>
                  </div>
                </div>
                {selectedCoach.blockAssignments.length > 0 ? (
                  <div className="dashboard-summary-list">
                    {selectedCoach.blockAssignments.map((block) => (
                      <div key={block.id} className="dashboard-summary-row">
                        <strong>{block.title}</strong>
                        <span>
                          {block.recurrenceSummary} · {block.rosterCount} rostered
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="No recurring blocks assigned"
                    description="Use the action below to attach a block to this coach."
                  />
                )}
              </div>

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">Assign block</div>
                    <h3>Attach a recurring block</h3>
                    <p>This replaces the coach on future occurrences of the selected block.</p>
                  </div>
                </div>
                <div className="dashboard-form-grid">
                  <label className="dashboard-form-field">
                    <span>Schedule block</span>
                    <select
                      className="dashboard-select"
                      value={selectedBlockId}
                      onChange={(event) => setSelectedBlockId(event.target.value)}
                    >
                      {blockOptions.map((block) => (
                        <option key={block.id} value={block.id}>
                          {block.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="mv-btn mv-btn-primary"
                    onClick={handleAssignBlock}
                    disabled={isSaving || !selectedBlockId}
                  >
                    Assign block
                  </button>
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
            <span>Initial / reset password</span>
            <input
              type="password"
              className="dashboard-input"
              value={formState.initialPassword}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  initialPassword: event.target.value,
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
