"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { approveLeadAsClient } from "@/app/actions/admin-leads";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
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
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Admin leads" />

      <DashboardSurfaceNote
        eyebrow="Approval flow"
        title="Review leads first, then approve only the ones that should become clients."
        description="This page keeps lead intake separate from account creation."
        items={[
          `${pendingLeads} awaiting review in this view.`,
          `${convertedLeads} already converted in this view.`,
        ]}
      />

      <section className="dashboard-mini-grid" aria-label="Lead highlights">
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Leads in view</span>
          <strong>{filteredRecords.length}</strong>
          <p>Current filtered lead list.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Awaiting approval</span>
          <strong>{pendingLeads}</strong>
          <p>Still only leads.</p>
        </article>
        <article className="dashboard-mini-stat">
          <span className="dashboard-mini-stat__label">Converted</span>
          <strong>{convertedLeads}</strong>
          <p>Already promoted to client.</p>
        </article>
      </section>

      <section className="dashboard-panel dashboard-panel--accent">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by lead, email, phone, or message"
          summary={`${filteredRecords.length} lead records in view`}
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
            <strong>Lead action</strong>
            <p>{actionMessage}</p>
          </div>
        ) : null}

        <div className="dashboard-data-region">
          {filteredRecords.length > 0 ? (
            <>
              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Created</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="dashboard-table__identity">
                            <strong>{lead.fullName}</strong>
                            <span>{lead.email}</span>
                            <small>{lead.phone}</small>
                          </div>
                        </td>
                        <td>
                          <DashboardStatusBadge
                            label={lead.status}
                            tone={getLeadTone(lead.status)}
                          />
                        </td>
                        <td>{lead.source}</td>
                        <td>{lead.createdAt}</td>
                        <td>{lead.message}</td>
                        <td>
                          {lead.status === "Converted" ? (
                            <DashboardStatusBadge label="Client created" tone="success" />
                          ) : (
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() => handleApprove(lead.id)}
                              disabled={isPending}
                            >
                              Approve as client
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
                  <article key={lead.id} className="dashboard-record-card">
                    <div className="dashboard-record-card__header">
                      <div>
                        <h3>{lead.fullName}</h3>
                        <p>{lead.email}</p>
                      </div>
                      <DashboardStatusBadge
                        label={lead.status}
                        tone={getLeadTone(lead.status)}
                      />
                    </div>
                    <div className="dashboard-record-card__meta">
                      <span>{lead.source}</span>
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
                          className="dashboard-inline-button"
                          onClick={() => handleApprove(lead.id)}
                          disabled={isPending}
                        >
                          <UserRoundPlus size={16} />
                          Approve as client
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
