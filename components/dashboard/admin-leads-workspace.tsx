"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { approveLeadAsClient } from "@/app/actions/admin-leads";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
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
  const [statusFilter, setStatusFilter] = useState<"All" | AdminLeadStatus>("All");
  const [actionMessage, setActionMessage] = useState("");

  const filteredRecords = useMemo(() => {
    return records.filter((lead) => {
      const query = deferredSearchTerm.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        [lead.fullName, lead.email, lead.phone, lead.message, lead.source]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearchTerm, records, statusFilter]);

  const pendingLeads = filteredRecords.filter((lead) => lead.status !== "Converted").length;
  const newLeads = filteredRecords.filter((lead) => lead.status === "New").length;
  const contactedLeads = filteredRecords.filter((lead) => lead.status === "Contacted").length;
  const convertedLeads = filteredRecords.filter((lead) => lead.status === "Converted").length;
  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "All";

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const handleApprove = (leadId: string) => {
    setActionMessage("");
    startTransition(async () => {
      try {
        const summary = await approveLeadAsClient(leadId);
        const promoted = summary.results.find((result) => result.outcome === "promoted");
        setActionMessage(promoted?.details ?? "Lead approved as client.");
        router.refresh();
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : "Approval failed.");
      }
    });
  };

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Admin leads"
        actions={
          <Link href="/admin/clients" className="mv-btn mv-btn-outline">
            <UserRoundPlus size={16} />
            Open Clients
          </Link>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Lead queue"
        title={
          pendingLeads > 0
            ? `${pendingLeads} leads still need a decision in this view.`
            : "All visible leads are already resolved or converted."
        }
        description="Work new inquiries first, move contacted leads to a decision, and only create clients when the lead is ready."
        items={[
          `${newLeads} new leads need first contact.`,
          `${contactedLeads} contacted leads are waiting on a decision.`,
          `${convertedLeads} converted leads stay here as history.`,
        ]}
      />

      <section
        className="dashboard-mini-grid dashboard-admin-priority-grid"
        aria-label="Lead highlights"
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
          searchPlaceholder="Search by lead, email, phone, or message"
          summary={`${filteredRecords.length} leads in view • ${pendingLeads} still need action`}
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
                      <th>Lead</th>
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
                          lead.status === "Converted" ? "dashboard-lead-row--converted" : undefined
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
                          <p className="dashboard-lead-table__message">{lead.message}</p>
                        </td>
                        <td className="dashboard-lead-table__action">
                          {lead.status === "Converted" ? (
                            <DashboardStatusBadge label="Client created" tone="success" />
                          ) : (
                            <button
                              type="button"
                              className="mv-btn mv-btn-primary dashboard-lead-table__approve"
                              onClick={() => handleApprove(lead.id)}
                              disabled={isPending}
                            >
                              <UserRoundPlus size={16} />
                              {isPending ? "Approving..." : "Approve"}
                            </button>
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
                        <span className="dashboard-record-card__eyebrow">{lead.source}</span>
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
                        <DashboardStatusBadge label="Client created" tone="success" />
                      ) : (
                        <button
                          type="button"
                          className="mv-btn mv-btn-primary"
                          onClick={() => handleApprove(lead.id)}
                          disabled={isPending}
                        >
                          <UserRoundPlus size={16} />
                          {isPending ? "Approving..." : "Approve as client"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <DashboardEmptyState
              title="No leads match these filters"
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
    </div>
  );
}
