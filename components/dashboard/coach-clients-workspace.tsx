"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { Download, MessageCircle, Save, UploadCloud, UserRoundSearch } from "lucide-react";

import { savePrivateClientNote, uploadCoachFile } from "@/app/actions/coach-client-assets";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardPaginationControls } from "@/components/dashboard/dashboard-pagination-controls";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import {
  coachClientPlanFilters,
  coachClientStatusFilters,
  type CoachClientRecord,
  type CoachClientPlan,
  type CoachClientStatus,
} from "@/lib/dashboard/coach-client-record";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
import { buildWhatsAppHref } from "@/lib/whatsapp";

type CoachClientSort = "name-asc" | "name-desc" | "status" | "plan";

const coachClientSortOptions: Array<{ label: string; value: CoachClientSort }> = [
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Status", value: "status" },
  { label: "Plan", value: "plan" },
];

function getCoachClientTone(status: CoachClientStatus) {
  switch (status) {
    case "On track":
      return "success";
    case "Needs check-in":
      return "warning";
    case "New this week":
      return "accent";
    default:
      return "neutral";
  }
}

function getSuggestedAction(status: CoachClientStatus) {
  switch (status) {
    case "Needs check-in":
      return "Prioritize a direct follow-up before this client loses rhythm.";
    case "Recovery focus":
      return "Keep the next touchpoint lighter and centered on recovery pacing.";
    case "New this week":
      return "Reinforce confidence and simplify the next progression cue.";
    default:
      return "Maintain momentum and log the next progress note after the next session.";
  }
}

type CoachClientsWorkspaceProps = {
  records: CoachClientRecord[];
};

export function CoachClientsWorkspace({ records }: CoachClientsWorkspaceProps) {
  const [isSavingAsset, startAssetTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<"All" | CoachClientStatus>("All");
  const [planFilter, setPlanFilter] = useState<"All" | CoachClientPlan>("All");
  const [sortOrder, setSortOrder] = useState<CoachClientSort>("name-asc");
  const [page, setPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState(records[0]?.id ?? "");
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [assetMessage, setAssetMessage] = useState("");

  const filteredClients = records.filter((client) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [client.fullName, client.currentFocus, client.progressNote, client.planType]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "All" || client.status === statusFilter;
    const matchesPlan = planFilter === "All" || client.planType === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((left, right) => {
      if (sortOrder === "name-desc") return right.fullName.localeCompare(left.fullName);
      if (sortOrder === "status") return left.status.localeCompare(right.status);
      if (sortOrder === "plan") return left.planType.localeCompare(right.planType);
      return left.fullName.localeCompare(right.fullName);
    });
  }, [filteredClients, sortOrder]);
  const paginatedClients = paginateDashboardItems(sortedClients, page);

  useEffect(() => {
    if (!filteredClients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(filteredClients[0]?.id ?? "");
    }
  }, [filteredClients, selectedClientId]);

  const selectedClient =
    filteredClients.find((client) => client.id === selectedClientId) ??
    filteredClients[0];
  const detailClient =
    filteredClients.find((client) => client.id === detailClientId) ?? null;
  const hasActiveFilters =
    searchTerm.trim().length > 0 || statusFilter !== "All" || planFilter !== "All";
  const needsCheckIn = filteredClients.filter(
    (client) => client.status === "Needs check-in"
  ).length;
  const activeHybrid = filteredClients.filter(
    (client) => client.planType === "Hybrid"
  ).length;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, planFilter, sortOrder]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPlanFilter("All");
  };

  const openDetail = (clientId: string) => {
    const client = filteredClients.find((record) => record.id === clientId);
    setSelectedClientId(clientId);
    setDetailClientId(clientId);
    setNoteContent(client?.privateNotes[0]?.content ?? "");
    setFileNote("");
    setAssetMessage("");
  };

  const saveNote = () => {
    if (!detailClient) return;
    setAssetMessage("");
    startAssetTransition(async () => {
      try {
        await savePrivateClientNote({
          clientId: detailClient.id,
          noteId: detailClient.privateNotes[0]?.id,
          content: noteContent,
        });
        setAssetMessage("Private note saved.");
      } catch (error) {
        setAssetMessage(error instanceof Error ? error.message : "Could not save note.");
      }
    });
  };

  const uploadFile = (formData: FormData) => {
    if (!detailClient) return;
    formData.set("scope", "client");
    formData.set("targetId", detailClient.id);
    formData.set("note", fileNote);
    setAssetMessage("");
    startAssetTransition(async () => {
      try {
        await uploadCoachFile(formData);
        setFileNote("");
        setAssetMessage("File uploaded. It will expire in 3 days.");
      } catch (error) {
        setAssetMessage(error instanceof Error ? error.message : "Could not upload file.");
      }
    });
  };

  const uploadGroupFile = (formData: FormData) => {
    if (!detailClient?.groupId) return;
    formData.set("scope", "group");
    formData.set("targetId", detailClient.groupId);
    formData.set("note", fileNote);
    setAssetMessage("");
    startAssetTransition(async () => {
      try {
        await uploadCoachFile(formData);
        setFileNote("");
        setAssetMessage("Group file uploaded. It will expire in 3 days.");
      } catch (error) {
        setAssetMessage(error instanceof Error ? error.message : "Could not upload file.");
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Coach clients" />

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by client, focus, or progress note"
            searchSuggestions={records.map((client) => ({
              label: client.fullName,
              value: client.fullName,
              detail: `${client.planType} - ${client.currentFocus}`,
            }))}
            summary={`${filteredClients.length} assigned clients in view`}
            sortValue={sortOrder}
            sortOptions={coachClientSortOptions}
            onSortChange={(value) => setSortOrder(value as CoachClientSort)}
            isFiltered={hasActiveFilters}
            onReset={resetFilters}
            filters={
              <>
                <label className="dashboard-filter-field">
                  <span>Status</span>
                  <select
                    className="dashboard-select"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "All" | CoachClientStatus)
                    }
                  >
                    {coachClientStatusFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Plan</span>
                  <select
                    className="dashboard-select"
                    value={planFilter}
                    onChange={(event) =>
                      setPlanFilter(event.target.value as "All" | CoachClientPlan)
                    }
                  >
                    {coachClientPlanFilters.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
          />

          <div className="dashboard-data-region">
            {filteredClients.length > 0 ? (
              <>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Next session</th>
                        <th>Last touchpoint</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClients.items.map((client) => (
                        <tr key={client.id}>
                          <td>
                            <div className="dashboard-table__identity">
                              <strong>{client.fullName}</strong>
                              <span>{client.currentFocus}</span>
                              <small>{client.progressNote}</small>
                            </div>
                          </td>
                          <td>{client.planType}</td>
                          <td>
                            <DashboardStatusBadge
                              label={client.status}
                              tone={getCoachClientTone(client.status)}
                            />
                          </td>
                          <td>{client.nextSession}</td>
                          <td>{client.lastTouchpoint}</td>
                          <td>
                            <button
                              type="button"
                              className="dashboard-inline-button"
                              onClick={() => openDetail(client.id)}
                            >
                              Open detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="dashboard-mobile-list">
                  {paginatedClients.items.map((client) => (
                    <article key={client.id} className="dashboard-record-card">
                      <div className="dashboard-record-card__header">
                        <div>
                          <h3>{client.fullName}</h3>
                          <p>{client.planType}</p>
                        </div>
                        <DashboardStatusBadge
                          label={client.status}
                          tone={getCoachClientTone(client.status)}
                        />
                      </div>
                      <div className="dashboard-record-card__meta">
                        <span>{client.nextSession}</span>
                        <span>{client.lastTouchpoint}</span>
                      </div>
                      <p className="dashboard-record-card__note">{client.progressNote}</p>
                      <div className="dashboard-row-actions">
                        <button
                          type="button"
                          className="dashboard-inline-button"
                          onClick={() => openDetail(client.id)}
                        >
                          View detail
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <DashboardEmptyState
                title="No clients match these filters"
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
          <DashboardPaginationControls
            page={paginatedClients.page}
            pageCount={paginatedClients.pageCount}
            startItem={paginatedClients.startItem}
            endItem={paginatedClients.endItem}
            totalItems={paginatedClients.totalItems}
            onPageChange={setPage}
          />
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          {selectedClient ? (
            <>
              <div className="dashboard-panel__header">
                <div>
                  <div className="mv-eyebrow">Client detail</div>
                  <h2>{selectedClient.fullName}</h2>
                  <p>{selectedClient.currentFocus}</p>
                </div>
                <UserRoundSearch size={20} color="#ff8b8f" />
              </div>

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Plan</span>
                  <strong>{selectedClient.planType}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Status</span>
                  <strong>{selectedClient.status}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Next session</span>
                  <strong>{selectedClient.nextSession}</strong>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Last touchpoint</span>
                  <strong>{selectedClient.lastTouchpoint}</strong>
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Progress note</span>
                <p>{selectedClient.progressNote}</p>
              </div>

              <div className="dashboard-info-strip">
                <strong>Suggested next move</strong>
                <p>{getSuggestedAction(selectedClient.status)}</p>
              </div>
            </>
          ) : (
            <DashboardEmptyState
              title="Client detail unavailable"
              description="Select a client to review details."
            />
          )}
        </aside>
      </section>

      <DashboardModal
        open={!!detailClient}
        onClose={() => setDetailClientId(null)}
        title={detailClient?.fullName ?? "Client details"}
        description={detailClient?.currentFocus}
        size="wide"
      >
        {detailClient ? (
          <div className="dashboard-stack">
            {assetMessage ? (
              <div className="dashboard-info-strip" role="status">
                <strong>Status</strong>
                <p>{assetMessage}</p>
              </div>
            ) : null}

            <div className="dashboard-detail-grid">
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Plan</span>
                <strong>{detailClient.planType}</strong>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Status</span>
                <strong>{detailClient.status}</strong>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Next session</span>
                <strong>{detailClient.nextSession}</strong>
              </div>
              <div className="dashboard-detail-stat">
                <span className="dashboard-detail-stat__label">Group</span>
                <strong>{detailClient.groupName}</strong>
              </div>
            </div>

            <div className="dashboard-row-actions">
              {buildWhatsAppHref(detailClient.phone) ? (
                <a
                  className="mv-btn mv-btn-outline"
                  href={buildWhatsAppHref(detailClient.phone) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              ) : null}
            </div>

            <div className="dashboard-form-section">
              <div className="dashboard-form-section__header">
                <div>
                  <div className="mv-eyebrow">Private note</div>
                  <h3>Coach-only note</h3>
                  <p>This note is never shown in the client portal.</p>
                </div>
              </div>
              <label className="dashboard-form-field dashboard-form-field--wide">
                <span>Note</span>
                <textarea
                  className="dashboard-textarea"
                  value={noteContent}
                  rows={4}
                  onChange={(event) => setNoteContent(event.target.value)}
                />
              </label>
              <div className="dashboard-row-actions">
                <button
                  type="button"
                  className="mv-btn mv-btn-primary"
                  onClick={saveNote}
                  disabled={isSavingAsset}
                >
                  <Save size={16} />
                  {isSavingAsset ? "Saving..." : "Save private note"}
                </button>
              </div>
              {detailClient.privateNotes.length > 0 ? (
                <div className="dashboard-summary-list">
                  {detailClient.privateNotes.map((note) => (
                    <div key={note.id} className="dashboard-summary-row">
                      <strong>{note.authorName}</strong>
                      <span>{note.content}</span>
                      <small>{note.updatedAtLabel}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <form action={uploadFile} className="dashboard-form-section">
              <div className="dashboard-form-section__header">
                <div>
                  <div className="mv-eyebrow">Files</div>
                  <h3>Upload client file</h3>
                  <p>Files are downloadable by the client and expire after 3 days.</p>
                </div>
              </div>
              <div className="dashboard-form-grid">
                <label className="dashboard-form-field">
                  <span>File</span>
                  <input className="dashboard-input" type="file" name="file" />
                </label>
                <label className="dashboard-form-field">
                  <span>File note</span>
                  <input
                    className="dashboard-input"
                    value={fileNote}
                    onChange={(event) => setFileNote(event.target.value)}
                  />
                </label>
              </div>
              <div className="dashboard-row-actions">
                <button
                  type="submit"
                  className="mv-btn mv-btn-secondary"
                  disabled={isSavingAsset}
                >
                  <UploadCloud size={16} />
                  {isSavingAsset ? "Uploading..." : "Upload file"}
                </button>
                {detailClient.groupId ? (
                  <button
                    type="submit"
                    formAction={uploadGroupFile}
                    className="mv-btn mv-btn-outline"
                    disabled={isSavingAsset}
                  >
                    <UploadCloud size={16} />
                    Upload to group
                  </button>
                ) : null}
              </div>
              {detailClient.activeFiles.length > 0 ? (
                <div className="dashboard-summary-list">
                  {detailClient.activeFiles.map((file) => (
                    <div key={file.id} className="dashboard-summary-row">
                      <strong>{file.name}</strong>
                      <span>{file.note}</span>
                      <small>Expires {file.expiresAtLabel}</small>
                      <a
                        className="dashboard-inline-button"
                        href={`/api/files/${file.id}/download`}
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </form>
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
