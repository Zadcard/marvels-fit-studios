"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, Plus, UserMinus, UserPlus } from "lucide-react";

import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
import {
  addClientToAdminScheduleBlock,
  removeClientFromAdminScheduleBlock,
  moveClientBetweenAdminScheduleBlocks,
} from "@/app/actions/admin-schedule-blocks";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  adminClientToneByStatus,
  adminClientWorkspaceDefinition,
  type AdminClientWorkspaceFilters,
} from "@/lib/dashboard/admin-client-workspace";
import { useManagedRecords } from "@/lib/dashboard/use-managed-records";
import type { WorkspaceRowAction } from "@/lib/dashboard/workspace-definition";
import {
  type AdminClientRecord,
} from "@/lib/dashboard/admin-dashboard-data";

type AdminClientsWorkspaceProps = {
  records: AdminClientRecord[];
  blockOptions: Array<{
    id: string;
    title: string;
  }>;
  groupOptions: Array<{
    id: string;
    name: string;
  }>;
};

function getPaymentTone(status: AdminClientRecord["paymentStatus"]) {
  switch (status) {
    case "Paid":
      return "success";
    case "Due soon":
      return "warning";
    default:
      return "neutral";
  }
}

export function AdminClientsWorkspace({
  records,
  blockOptions,
  groupOptions,
}: AdminClientsWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
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
      paymentStatus: "All",
    } satisfies AdminClientWorkspaceFilters,
  });

  const [selectedClientId, setSelectedClientId] = useState(records[0]?.id ?? "");
  const [isMutating, startMutatingTransition] = useTransition();
  const [moveTargetBlockId, setMoveTargetBlockId] = useState(blockOptions[0]?.id ?? "");
  const [assignBlockId, setAssignBlockId] = useState(blockOptions[0]?.id ?? "");

  const selectedClient =
    filteredRecords.find((client) => client.id === selectedClientId) ?? filteredRecords[0];

  const handleAssignBlock = () => {
    if (!selectedClient || !assignBlockId) return;
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await addClientToAdminScheduleBlock(assignBlockId, selectedClient.id);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not assign block.");
      }
    });
  };

  const handleRemoveFromBlock = () => {
    if (!selectedClient?.primaryBlockId) return;
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await removeClientFromAdminScheduleBlock(selectedClient.primaryBlockId!, selectedClient.id);
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not remove from block.");
      }
    });
  };

  const handleMoveBlock = () => {
    if (!selectedClient?.primaryBlockId || !moveTargetBlockId) return;
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await moveClientBetweenAdminScheduleBlocks(
          selectedClient.primaryBlockId!,
          moveTargetBlockId,
          selectedClient.id
        );
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not move client.");
      }
    });
  };

  const activeClients = filteredRecords.filter((client) => client.status === "Active").length;
  const paymentAttentionCount = filteredRecords.filter(
    (client) => client.paymentStatus !== "Paid"
  ).length;
  const unassignedCoachCount = filteredRecords.filter(
    (client) => client.assignedCoach === "Unassigned"
  ).length;
  const awaitingSessionCount = filteredRecords.filter(
    (client) => client.nextSession === "Awaiting first session"
  ).length;

  const getRowActions = (): WorkspaceRowAction<AdminClientRecord>[] => [
    {
      label: "Inspect",
      onClick: (client) => setSelectedClientId(client.id),
    },
    {
      label: "Edit",
      onClick: openEditModal,
    },
  ];

  const handleSaveClient = () => {
    setErrorMessage("");

    startTransition(async () => {
      try {
        await saveAdminClient({
          clientId: editingRecordId,
          fullName: formState.fullName,
          email: formState.email,
          phone: formState.phone,
          initialPassword: formState.initialPassword,
          status: formState.status,
          paymentStatus: formState.paymentStatus,
          paymentAmount: formState.paymentAmount,
          groupId: formState.groupId,
          blockId: formState.blockId,
        });
        setIsModalOpen(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save client."
        );
      }
    });
  };

  const handleDeleteClient = () => {
    if (!editingRecordId) {
      return;
    }

    setErrorMessage("");

    startDeleteTransition(async () => {
      try {
        await deleteAdminClient({
          clientId: editingRecordId,
          confirmationText: deleteConfirmationText,
        });
        setIsDeleteModalOpen(false);
        setDeleteConfirmationText("");
        setIsModalOpen(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not delete client."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Admin clients"
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

      <DashboardSurfaceNote
        eyebrow="Client roster"
        title={
          paymentAttentionCount > 0
            ? `${paymentAttentionCount} clients need billing attention in this view.`
            : "Billing is clear enough to focus on coach coverage and session readiness."
        }
        description="Scan billing attention first, then resolve missing coach assignment or first-session readiness."
        items={[
          `${activeClients} active clients currently in this filtered roster.`,
          `${unassignedCoachCount} clients still need a coach assignment.`,
          `${awaitingSessionCount} clients are still waiting for a first session.`,
        ]}
      />

      <section
        className="dashboard-mini-grid dashboard-admin-priority-grid"
        aria-label="Client priorities"
      >
        <DashboardMiniStat
          tone={paymentAttentionCount > 0 ? "warning" : "success"}
          label="Billing attention"
          value={paymentAttentionCount}
          description="Due soon or unpaid."
        />
        <DashboardMiniStat
          tone={unassignedCoachCount > 0 ? "accent" : "success"}
          label="Unassigned coach"
          value={unassignedCoachCount}
          description="Need coach coverage."
        />
        <DashboardMiniStat
          tone={awaitingSessionCount > 0 ? "accent" : "success"}
          label="Awaiting session"
          value={awaitingSessionCount}
          description="No first session booked yet."
        />
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={adminClientWorkspaceDefinition.searchPlaceholder}
          summary={`${filteredRecords.length} clients in view • ${paymentAttentionCount} need billing attention`}
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
        />

        <div className="dashboard-data-region">
          {filteredRecords.length > 0 ? (
            <>
              <div className="dashboard-panel__meta-strip">
                <span>{activeClients} active</span>
                <span>{paymentAttentionCount} billing watch</span>
                <span>{unassignedCoachCount} unassigned</span>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table dashboard-client-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Payment</th>
                      <th>Assignment</th>
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
                          <div className="dashboard-client-table__program">
                            <DashboardStatusBadge
                              label={client.status}
                              tone={adminClientToneByStatus[client.status]}
                            />
                            <span>{client.membership}</span>
                            <span>Joined {client.joinedDate}</span>
                          </div>
                        </td>
                        <td>
                          <div className="dashboard-client-table__billing">
                            <DashboardStatusBadge
                              label={client.paymentStatus}
                              tone={getPaymentTone(client.paymentStatus)}
                            />
                            <strong>{client.paymentAmountLabel}</strong>
                            <p>
                              {client.paymentStatus === "Paid"
                                ? "Billing is current."
                                : "Needs billing follow-up."}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="dashboard-client-table__readiness">
                            <strong>{client.assignedCoach}</strong>
                            <span>{client.primaryGroup}</span>
                            <div className="dashboard-badge-stack">
                              {client.primaryBlockId ? (
                                <DashboardStatusBadge label={client.primaryBlock} tone="neutral" />
                              ) : (
                                <DashboardStatusBadge label="No block" tone="accent" />
                              )}
                              {client.nextSession === "Awaiting first session" ? (
                                <DashboardStatusBadge label="Awaiting session" tone="warning" />
                              ) : null}
                            </div>
                            <small>{client.nextSessions[0] ?? client.nextSession}</small>
                          </div>
                        </td>
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
                  <article
                    key={client.id}
                    className="dashboard-record-card dashboard-record-card--client"
                  >
                    <div className="dashboard-record-card__header">
                      <div>
                        <span className="dashboard-record-card__eyebrow">
                          {client.membership}
                        </span>
                        <h3>{client.fullName}</h3>
                        <p>{client.email}</p>
                      </div>
                      <DashboardStatusBadge
                        label={client.status}
                        tone={adminClientToneByStatus[client.status]}
                      />
                    </div>
                    <div className="dashboard-record-card__meta">
                      <span>{client.paymentStatus}</span>
                      <span>{client.assignedCoach}</span>
                      <span>{client.primaryGroup}</span>
                    </div>
                    <div className="dashboard-badge-stack">
                      <DashboardStatusBadge
                        label={client.paymentStatus}
                        tone={getPaymentTone(client.paymentStatus)}
                      />
                      {client.primaryBlockId ? (
                        <DashboardStatusBadge label={client.primaryBlock} tone="neutral" />
                      ) : (
                        <DashboardStatusBadge label="No block" tone="accent" />
                      )}
                      {client.nextSession === "Awaiting first session" ? (
                        <DashboardStatusBadge label="Awaiting session" tone="warning" />
                      ) : null}
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
                          {action.label === "Edit" ? "Edit client" : action.label}
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
              description="Try a different search or reset the filters."
            />
          )}
        </div>
        </article>

        <aside className="dashboard-panel dashboard-detail-panel dashboard-panel--dense">
          {selectedClient ? (
            <>
              <div className="dashboard-panel__header dashboard-panel__header--tight">
                <div>
                  <div className="mv-eyebrow">Client detail</div>
                  <h2>{selectedClient.fullName}</h2>
                  <p>{selectedClient.progressNote}</p>
                </div>
                <div className="dashboard-badge-stack">
                  <DashboardStatusBadge
                    label={selectedClient.status}
                    tone={adminClientToneByStatus[selectedClient.status]}
                  />
                  <DashboardStatusBadge
                    label={selectedClient.paymentStatus}
                    tone={getPaymentTone(selectedClient.paymentStatus)}
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="dashboard-empty-state" role="alert">
                  <strong>Action blocked</strong>
                  <p>{errorMessage}</p>
                </div>
              ) : null}

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Coach</span>
                  <strong>{selectedClient.assignedCoach}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Group</span>
                  <strong>{selectedClient.primaryGroup}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Block</span>
                  <strong>{selectedClient.primaryBlock}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Membership</span>
                  <strong>{selectedClient.membership}</strong>
                  <small>{selectedClient.paymentAmountLabel}</small>
                </div>
              </div>

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">Sessions</div>
                    <h3>Upcoming schedule</h3>
                    <p>Next booked sessions for this client.</p>
                  </div>
                </div>
                {selectedClient.nextSessions.length > 0 ? (
                  <div className="dashboard-summary-list">
                    {selectedClient.nextSessions.slice(0, 3).map((session, index) => (
                      <div key={index} className="dashboard-summary-row">
                        <strong>{session}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="No upcoming sessions"
                    description={selectedClient.nextSession}
                  />
                )}
              </div>

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">Block assignment</div>
                    <h3>Recurring structure</h3>
                    <p>Assign, move, or remove from a recurring block.</p>
                  </div>
                </div>

                {selectedClient.primaryBlockId ? (
                  <div className="dashboard-row-actions">
                    <Link href="/admin/blocks" className="mv-btn mv-btn-outline">
                      Open block
                    </Link>
                    <button
                      type="button"
                      className="mv-btn mv-btn-danger"
                      onClick={handleRemoveFromBlock}
                      disabled={isMutating}
                    >
                      <UserMinus size={16} />
                      Remove from block
                    </button>
                  </div>
                ) : null}

                {selectedClient.primaryBlockId ? (
                  <>
                    <div className="dashboard-form-grid">
                      <label className="dashboard-form-field">
                        <span>Move to block</span>
                        <select
                          className="dashboard-select"
                          value={moveTargetBlockId}
                          onChange={(event) => setMoveTargetBlockId(event.target.value)}
                          disabled={isMutating}
                        >
                          {blockOptions
                            .filter((block) => block.id !== selectedClient.primaryBlockId)
                            .map((block) => (
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
                        className="mv-btn mv-btn-secondary"
                        onClick={handleMoveBlock}
                        disabled={isMutating || !moveTargetBlockId}
                      >
                        <ArrowRightLeft size={16} />
                        {isMutating ? "Moving..." : "Move to block"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dashboard-form-grid">
                      <label className="dashboard-form-field">
                        <span>Assign to block</span>
                        <select
                          className="dashboard-select"
                          value={assignBlockId}
                          onChange={(event) => setAssignBlockId(event.target.value)}
                          disabled={isMutating}
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
                        disabled={isMutating || !assignBlockId}
                      >
                        <UserPlus size={16} />
                        {isMutating ? "Assigning..." : "Assign to block"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => openEditModal(selectedClient)}
              >
                Edit Client
              </button>
            </>
          ) : (
            <DashboardEmptyState
              title="No client selected"
              description="Choose a client to view their assignment chain and quick actions."
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
        title={editingRecordId ? "Edit client" : "Add client"}
        description="Client details"
        footer={
          <>
            {editingRecordId ? (
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
                Delete client
              </button>
            ) : null}
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => {
                setErrorMessage("");
                setIsModalOpen(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={handleSaveClient}
              disabled={isSaving || isDeleting}
            >
              {isSaving
                ? "Saving..."
                : editingRecordId
                  ? "Save client"
                  : "Create client"}
            </button>
          </>
        }
      >
        {errorMessage ? (
          <div className="dashboard-empty-state" role="alert">
            <strong>Could not save client</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}
        <div className="dashboard-stack">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <div className="mv-eyebrow">Payment controls</div>
                <h2>Set payment status</h2>
                <p>Client profile, status, and payment changes save to the database.</p>
              </div>
            </div>
            <div className="dashboard-row-actions">
              {(["Paid", "Due soon", "Unpaid"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    formState.paymentStatus === status
                      ? "mv-btn mv-btn-primary"
                      : "mv-btn mv-btn-outline"
                  }
                  onClick={() => updateFormField("paymentStatus", status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dashboard-form-grid">
          {adminClientWorkspaceDefinition.formFields
            .filter((field) => field.key !== "paymentStatus")
            .map((field) => (
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
          <label className="dashboard-form-field">
            <span>Primary group</span>
            <select
              className="dashboard-select"
              value={formState.groupId}
              onChange={(event) => updateFormField("groupId", event.target.value)}
            >
              <option value="">No group</option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-form-field">
            <span>Recurring block</span>
            <select
              className="dashboard-select"
              value={formState.blockId}
              onChange={(event) => updateFormField("blockId", event.target.value)}
            >
              <option value="">No recurring block</option>
              {blockOptions.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.title}
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
        title="Delete client"
        description='Type "Delete" to confirm client deletion'
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
              onClick={handleDeleteClient}
              disabled={isDeleting || deleteConfirmationText.trim() !== "Delete"}
            >
              {isDeleting ? "Deleting..." : "Delete client"}
            </button>
          </>
        }
      >
        {errorMessage ? (
          <div className="dashboard-empty-state" role="alert">
            <strong>Could not delete client</strong>
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
              placeholder='Type "Delete" to confirm client deletion'
            />
          </label>
        </div>
      </DashboardModal>
    </div>
  );
}
