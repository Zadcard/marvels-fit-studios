"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { deleteAdminClient, saveAdminClient } from "@/app/actions/admin-clients";
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
} from "@/lib/dashboard/admin-dashboard-data";

type AdminClientsWorkspaceProps = {
  records: AdminClientRecord[];
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

export function AdminClientsWorkspace({ records }: AdminClientsWorkspaceProps) {
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

  const getRowActions = (): WorkspaceRowAction<AdminClientRecord>[] => [
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
    <div className="dashboard-stack">
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
                      <th>Payment</th>
                      <th>Amount</th>
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
                        <td>
                          <DashboardStatusBadge
                            label={client.paymentStatus}
                            tone={getPaymentTone(client.paymentStatus)}
                          />
                        </td>
                        <td>{client.paymentAmountLabel}</td>
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
                      <span>{client.paymentStatus}</span>
                      <span>{client.paymentAmountLabel}</span>
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
