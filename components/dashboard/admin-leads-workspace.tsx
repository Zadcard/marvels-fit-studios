"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { approveLeadAsClient, deleteLead } from "@/app/actions/admin-leads";
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
import type { AdminLeadInitialOption } from "@/lib/repositories/admin-lead-repository";

const visibleLeadStatusFilters = adminLeadStatusFilters.filter(
  (filter) => filter !== "Contacted"
);

type AdminLeadsWorkspaceProps = {
  records: AdminLeadRecord[];
  searchValue: string;
  selectedInitial: string | null;
  sortOrder: "asc" | "desc";
  totalCount: number;
  filteredCount: number;
  initialOptions: AdminLeadInitialOption[];
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

function formatResultsLabel(filteredCount: number, totalCount: number) {
  if (filteredCount === totalCount) {
    return `${totalCount} requests`;
  }

  return `${filteredCount} of ${totalCount} requests`;
}

export function AdminLeadsWorkspace({
  records,
  searchValue,
  selectedInitial,
  sortOrder,
  totalCount,
  filteredCount,
  initialOptions,
}: AdminLeadsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isFilterPending, startFilterTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(searchValue);
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

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
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
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === searchValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateQuery({ q: normalizedSearch || null });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchValue, updateQuery]);

  const filteredRecords = useMemo(() => {
    return records.filter((lead) => {
      return statusFilter === "All" || lead.status === statusFilter;
    });
  }, [records, statusFilter]);

  const pendingLeads = filteredRecords.filter(
    (lead) => lead.status !== "Converted"
  ).length;
  const newLeads = filteredRecords.filter((lead) => lead.status === "New").length;
  const convertedLeads = filteredRecords.filter(
    (lead) => lead.status === "Converted"
  ).length;
  const hasActiveFilters =
    searchInput.trim().length > 0 ||
    statusFilter !== "All" ||
    selectedInitial !== null ||
    sortOrder !== "asc";

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter("All");
    updateQuery({
      q: null,
      initial: null,
      sort: null,
    });
  };

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
          `${convertedLeads} converted requests stay here as history.`,
          `${pendingLeads} visible requests still need action.`,
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
          tone="success"
          label="Converted"
          value={convertedLeads}
          description="Already promoted to client."
        />
      </section>

      <section className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <div className="dashboard-clients-toolbar">
          <div className="dashboard-clients-toolbar__copy">
            <div className="mv-eyebrow">Join intake</div>
            <h2>Search requests</h2>
            <p>
              {formatResultsLabel(filteredCount, totalCount)}
              {isFilterPending ? " updating..." : ""}
            </p>
          </div>

          <label className="dashboard-clients-search" htmlFor="admin-lead-search">
            <span>Search</span>
            <input
              id="admin-lead-search"
              type="search"
              className="dashboard-clients-search__input"
              placeholder="Search name, email, phone, source, message"
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

          <div className="dashboard-clients-filter-group">
            <span className="dashboard-clients-filter-group__label">Status</span>
            <div className="dashboard-clients-checkbox-row">
              {visibleLeadStatusFilters.map((filter) => (
                <label key={filter} className="dashboard-clients-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      filter === "All"
                        ? statusFilter === "All"
                        : statusFilter === filter
                    }
                    onChange={() =>
                      setStatusFilter(filter as "All" | AdminLeadStatus)
                    }
                  />
                  <span>{filter}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

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
                <span>{convertedLeads} converted</span>
                <span>{pendingLeads} still need action</span>
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
