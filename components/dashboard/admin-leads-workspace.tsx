"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { approveLeadAsClient, deleteLead } from "@/app/actions/admin-leads";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  adminLeadStatusFilters,
  type AdminLeadRecord,
  type AdminLeadStatus,
} from "@/lib/dashboard/admin-dashboard-data";

type AdminLeadsWorkspaceProps = {
  records: AdminLeadRecord[];
};

function getLeadTone(status: AdminLeadStatus) {
  switch (status) {
    case "New":
      return "accent";
    case "Contacted":
      return "warning";
    case "Converted":
      return "success";
    default:
      return "neutral";
  }
}

export function AdminLeadsWorkspace({ records }: AdminLeadsWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | AdminLeadStatus>(
    "All"
  );
  const [actionMessage, setActionMessage] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<{
    clientId: string;
    temporaryPassword: string;
    details: string;
  } | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<AdminLeadRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((lead) => {
      const query = deferredSearchTerm.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        [lead.fullName, lead.email, lead.phone, lead.message, lead.source]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "All" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearchTerm, records, statusFilter]);

  const pendingLeads = filteredRecords.filter(
    (lead) => lead.status !== "Converted"
  ).length;
  const newLeads = filteredRecords.filter((lead) => lead.status === "New").length;
  const contactedLeads = filteredRecords.filter(
    (lead) => lead.status === "Contacted"
  ).length;
  const convertedLeads = filteredRecords.filter(
    (lead) => lead.status === "Converted"
  ).length;
  const hasActiveFilters =
    searchTerm.trim().length > 0 || statusFilter !== "All";

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const handleApprove = (leadId: string) => {
    setActionMessage("");
    setIssuedCredentials(null);
    startTransition(async () => {
      try {
        const summary = await approveLeadAsClient(leadId);
        const promoted = summary.results.find(
          (result) => result.outcome === "promoted"
        );
        if (promoted?.clientId && promoted.temporaryPassword) {
          setIssuedCredentials({
            clientId: promoted.clientId,
            temporaryPassword: promoted.temporaryPassword,
            details: promoted.details,
          });
          setActionMessage(
            `${promoted.details} The client must change the password on first login.`
          );
        } else {
          setActionMessage(promoted?.details ?? "Request approved as client.");
        }
        router.refresh();
      } catch (error) {
        setActionMessage(
          error instanceof Error ? error.message : "Approval failed."
        );
      }
    });
  };

  const handleDelete = () => {
    if (!leadToDelete) {
      return;
    }

    setActionMessage("");
    setIssuedCredentials(null);
    startTransition(async () => {
      try {
        await deleteLead(leadToDelete.id);
        setActionMessage(`Deleted lead for ${leadToDelete.fullName}.`);
        setLeadToDelete(null);
        router.refresh();
      } catch (error) {
        setActionMessage(
          error instanceof Error ? error.message : "Delete failed."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Join requests"
        actions={
          <Link href="/admin/clients" className="mv-btn mv-btn-outline">
            <UserRoundPlus size={16} />
            Open Clients
          </Link>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Join request queue"
        title={
          pendingLeads > 0
            ? `${pendingLeads} requests still need a decision in this view.`
            : "All visible requests are already resolved or converted."
        }
        description="Work new inquiries first, move contacted requests to a decision, and only create clients when the request is ready."
        items={[
          `${newLeads} new requests need first contact.`,
          `${contactedLeads} contacted requests are waiting on a decision.`,
          `${convertedLeads} converted requests stay here as history.`,
        ]}
      />

      <section
        className="dashboard-mini-grid dashboard-admin-priority-grid"
        aria-label="Join request highlights"
      >
        <DashboardMiniStat
          tone={newLeads > 0 ? "accent" : "success"}
          label="New"
          value={newLeads}
          description="Need first response."
        />
        <DashboardMiniStat
          tone={contactedLeads > 0 ? "warning" : "success"}
          label="Contacted"
          value={contactedLeads}
          description="Waiting on a decision."
        />
        <DashboardMiniStat
          tone="success"
          label="Converted"
          value={convertedLeads}
          description="Already promoted to client."
        />
      </section>

      <section className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by request, email, phone, or message"
          summary={`${filteredRecords.length} requests in view • ${pendingLeads} still need action`}
          isFiltered={hasActiveFilters}
          onReset={resetFilters}
          filters={
            <label className="dashboard-filter-field">
              <span>Status</span>
              <select
                className="dashboard-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "All" | AdminLeadStatus)
                }
              >
                {adminLeadStatusFilters.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
            </label>
          }
        />

        {actionMessage ? (
          <div className="dashboard-info-strip">
            <strong>Latest action</strong>
            <p>{actionMessage}</p>
          </div>
        ) : null}

        {issuedCredentials ? (
          <div className="dashboard-credentials-screen" role="alert">
            <div className="dashboard-credentials-screen__header">
              <div className="mv-eyebrow">Client Credentials</div>
              <h2>Share these login details with the client</h2>
              <p>{issuedCredentials.details}</p>
            </div>

            <div className="dashboard-credentials-screen__grid">
              <div className="dashboard-credentials-screen__card">
                <span>Client ID</span>
                <strong>{issuedCredentials.clientId}</strong>
              </div>
              <div className="dashboard-credentials-screen__card">
                <span>Temporary Password</span>
                <strong>{issuedCredentials.temporaryPassword}</strong>
              </div>
            </div>

            <p className="dashboard-credentials-screen__footnote">
              The client must change this password immediately after the first login.
            </p>
            <p className="dashboard-credentials-screen__footnote">
              *Note: when logging in the password must be changed by a strong password.
            </p>
          </div>
        ) : null}

        <div className="dashboard-data-region">
          {filteredRecords.length > 0 ? (
            <>
              <div className="dashboard-panel__meta-strip">
                <span>{newLeads} new</span>
                <span>{contactedLeads} contacted</span>
                <span>{convertedLeads} converted</span>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table dashboard-lead-table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Queue</th>
                      <th>Message</th>
                      <th>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((lead) => (
                      <tr
                        key={lead.id}
                        className={
                          lead.status === "Converted"
                            ? "dashboard-lead-row--converted"
                            : undefined
                        }
                      >
                        <td>
                          <div className="dashboard-table__identity">
                            <strong>{lead.fullName}</strong>
                            <span>{lead.email}</span>
                            <small>{lead.phone}</small>
                          </div>
                        </td>
                        <td>
                          <div className="dashboard-lead-table__status">
                            <DashboardStatusBadge
                              label={lead.status}
                              tone={getLeadTone(lead.status)}
                            />
                            <div className="dashboard-lead-table__meta">
                              <span>{lead.source}</span>
                              <span>{lead.createdAt}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="dashboard-lead-table__message">
                            {lead.message}
                          </p>
                        </td>
                        <td className="dashboard-lead-table__action">
                          {lead.status === "Converted" ? (
                            <DashboardStatusBadge
                              label="Client created"
                              tone="success"
                            />
                          ) : (
                            <div className="dashboard-lead-table__action-stack">
                              <button
                                type="button"
                                className="mv-btn mv-btn-primary dashboard-lead-table__approve dashboard-lead-table__approve--small"
                                onClick={() => handleApprove(lead.id)}
                                disabled={isPending}
                              >
                                <UserRoundPlus size={14} />
                                {isPending ? "Approving..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                className="mv-btn mv-btn-danger dashboard-lead-table__delete"
                                onClick={() => setLeadToDelete(lead)}
                                disabled={isPending}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dashboard-mobile-list">
                {filteredRecords.map((lead) => (
                  <article
                    key={lead.id}
                    className={
                      lead.status === "Converted"
                        ? "dashboard-record-card dashboard-record-card--lead"
                        : "dashboard-record-card dashboard-record-card--lead dashboard-record-card--active"
                    }
                  >
                    <div className="dashboard-record-card__header">
                      <div>
                        <span className="dashboard-record-card__eyebrow">
                          {lead.source}
                        </span>
                        <h3>{lead.fullName}</h3>
                        <p>{lead.email}</p>
                      </div>
                      <DashboardStatusBadge
                        label={lead.status}
                        tone={getLeadTone(lead.status)}
                      />
                    </div>
                    <div className="dashboard-record-card__meta">
                      <span>{lead.createdAt}</span>
                      <span>{lead.phone}</span>
                    </div>
                    <p className="dashboard-record-card__note">{lead.message}</p>
                    <div className="dashboard-row-actions">
                      {lead.status === "Converted" ? (
                        <DashboardStatusBadge
                          label="Client created"
                          tone="success"
                        />
                      ) : (
                        <>
                          <button
                            type="button"
                            className="mv-btn mv-btn-primary dashboard-lead-table__approve--small"
                            onClick={() => handleApprove(lead.id)}
                            disabled={isPending}
                          >
                            <UserRoundPlus size={14} />
                            {isPending ? "Approving..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            className="mv-btn mv-btn-danger"
                            onClick={() => setLeadToDelete(lead)}
                            disabled={isPending}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <DashboardEmptyState
              title="No join requests match these filters"
              description="Try a different search or reset the filters."
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    className="dashboard-inline-button"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          )}
        </div>
      </section>

      <DashboardModal
        open={Boolean(leadToDelete)}
        onClose={() => {
          if (isPending) {
            return;
          }

          setLeadToDelete(null);
        }}
        title="Delete lead"
        description={
          leadToDelete
            ? `Delete ${leadToDelete.fullName} from join requests? This will remove the lead from the database.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => setLeadToDelete(null)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-danger"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Confirm delete"}
            </button>
          </>
        }
      >
        <div className="dashboard-empty-state">
          <strong>Confirmation required</strong>
          <p>
            If you cancel or close this popup, the lead will not be deleted.
          </p>
        </div>
      </DashboardModal>
    </div>
  );
}
