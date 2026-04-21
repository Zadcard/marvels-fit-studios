"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, Plus, UserMinus, UserPlus } from "lucide-react";

import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
import {
  addClientToAdminScheduleBlock,
  moveClientBetweenAdminScheduleBlocks,
  removeClientFromAdminScheduleBlock,
} from "@/app/actions/admin-schedule-blocks";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  adminClientToneByStatus,
  adminClientWorkspaceDefinition,
  type ClientFormState,
} from "@/lib/dashboard/admin-client-workspace";
import type {
  AdminClientInitialOption,
  AdminClientRecord,
} from "@/lib/dashboard/admin-dashboard-data";

type AdminClientsWorkspaceProps = {
  records: AdminClientRecord[];
  searchValue: string;
  selectedInitial: string | null;
  sortOrder: "asc" | "desc";
  totalCount: number;
  filteredCount: number;
  initialOptions: AdminClientInitialOption[];
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

function formatResultsLabel(filteredCount: number, totalCount: number) {
  if (filteredCount === totalCount) {
    return `${totalCount} clients`;
  }

  return `${filteredCount} of ${totalCount} clients`;
}

export function AdminClientsWorkspace({
  records,
  searchValue,
  selectedInitial,
  sortOrder,
  totalCount,
  filteredCount,
  initialOptions,
  blockOptions,
  groupOptions,
}: AdminClientsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isFilterPending, startFilterTransition] = useTransition();
  const [isMutating, startMutatingTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ClientFormState>(
    adminClientWorkspaceDefinition.createEmptyForm()
  );
  const [searchInput, setSearchInput] = useState(searchValue);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(records[0]?.id ?? "");
  const [moveTargetBlockId, setMoveTargetBlockId] = useState(
    blockOptions[0]?.id ?? ""
  );
  const [assignBlockId, setAssignBlockId] = useState(blockOptions[0]?.id ?? "");

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (records.some((client) => client.id === selectedClientId)) {
      return;
    }

    setSelectedClientId(records[0]?.id ?? "");
  }, [records, selectedClientId]);

  const selectedClient =
    records.find((client) => client.id === selectedClientId) ?? records[0] ?? null;

  const updateFormField = (key: keyof ClientFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingRecordId(null);
    setFormState(adminClientWorkspaceDefinition.createEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (record: AdminClientRecord) => {
    setEditingRecordId(record.id);
    setFormState(adminClientWorkspaceDefinition.toFormState(record));
    setIsModalOpen(true);
  };

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    startFilterTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === searchValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateQuery({ q: normalizedSearch || null });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchValue]);

  const handleSortToggle = (nextSort: "asc" | "desc") => {
    updateQuery({
      sort: sortOrder === nextSort ? null : nextSort,
    });
  };

  const handleInitialToggle = (nextInitial: string) => {
    updateQuery({
      initial: selectedInitial === nextInitial ? null : nextInitial,
    });
  };

  const handleAssignBlock = () => {
    if (!selectedClient || !assignBlockId) return;
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await addClientToAdminScheduleBlock(assignBlockId, selectedClient.id);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not assign block."
        );
      }
    });
  };

  const handleRemoveFromBlock = () => {
    if (!selectedClient?.primaryBlockId) return;
    const primaryBlockId = selectedClient.primaryBlockId;
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await removeClientFromAdminScheduleBlock(primaryBlockId, selectedClient.id);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not remove from block."
        );
      }
    });
  };

  const handleMoveBlock = () => {
    if (!selectedClient?.primaryBlockId || !moveTargetBlockId) return;
    const primaryBlockId = selectedClient.primaryBlockId;
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await moveClientBetweenAdminScheduleBlocks(
          primaryBlockId,
          moveTargetBlockId,
          selectedClient.id
        );
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not move client."
        );
      }
    });
  };

  const handleSaveClient = () => {
    setErrorMessage("");

    startTransition(async () => {
      try {
        await saveAdminClient({
          clientId: editingRecordId,
          fullName: formState.fullName,
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

      <section className="dashboard-clients-shell">
        <article className="dashboard-clients-roster-panel">
          <div className="dashboard-clients-toolbar">
            <div className="dashboard-clients-toolbar__copy">
              <div className="mv-eyebrow">Client directory</div>
              <h2>Search clients</h2>
              <p>
                {formatResultsLabel(filteredCount, totalCount)}
                {isFilterPending ? " updating..." : ""}
              </p>
            </div>

            <label className="dashboard-clients-search" htmlFor="admin-client-search">
              <span>Search</span>
              <input
                id="admin-client-search"
                type="search"
                className="dashboard-clients-search__input"
                placeholder="Search name, ID, phone, email"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="dashboard-clients-filters">
            <div className="dashboard-clients-filter-group">
              <span className="dashboard-clients-filter-group__label">Sort</span>
              <div className="dashboard-clients-checkbox-row">
                <label className="dashboard-clients-checkbox">
                  <input
                    type="checkbox"
                    checked={sortOrder === "asc"}
                    onChange={() => handleSortToggle("asc")}
                  />
                  <span>A-Z</span>
                </label>
                <label className="dashboard-clients-checkbox">
                  <input
                    type="checkbox"
                    checked={sortOrder === "desc"}
                    onChange={() => handleSortToggle("desc")}
                  />
                  <span>Z-A</span>
                </label>
              </div>
            </div>

            <div className="dashboard-clients-filter-group">
              <span className="dashboard-clients-filter-group__label">Initial</span>
              <div className="dashboard-clients-initials">
                <label className="dashboard-clients-checkbox dashboard-clients-checkbox--compact">
                  <input
                    type="checkbox"
                    checked={!selectedInitial}
                    onChange={() => updateQuery({ initial: null })}
                  />
                  <span>All</span>
                </label>
                {initialOptions.map((option) => (
                  <label
                    key={option.label}
                    className="dashboard-clients-checkbox dashboard-clients-checkbox--compact"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInitial === option.label}
                      onChange={() => handleInitialToggle(option.label)}
                    />
                    <span>
                      {option.label}
                      <small>{option.count}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-clients-roster-list">
            {records.length > 0 ? (
              records.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className={`dashboard-clients-roster-item ${
                    selectedClient?.id === client.id
                      ? "dashboard-clients-roster-item--active"
                      : ""
                  }`}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div className="dashboard-clients-roster-item__topline">
                    <strong>{client.fullName}</strong>
                    <DashboardStatusBadge
                      label={client.status}
                      tone={adminClientToneByStatus[client.status]}
                    />
                  </div>
                  <div className="dashboard-clients-roster-item__meta">
                    <span>{client.clientId}</span>
                    <span>{client.phone}</span>
                    <span>{client.assignedCoach}</span>
                  </div>
                </button>
              ))
            ) : (
              <DashboardEmptyState
                title="No clients found"
                description="Try a different search term or choose another initial."
              />
            )}
          </div>
        </article>

        <aside className="dashboard-clients-detail-panel">
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
                  <span className="dashboard-detail-stat__label">Client ID</span>
                  <strong>{selectedClient.clientId}</strong>
                </div>
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
              description="Choose a client from the roster to inspect details."
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
