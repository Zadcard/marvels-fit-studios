"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { CalendarPlus2, Copy, Pause, Play, SquareStack, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addClientToAdminScheduleBlock,
  removeClientFromAdminScheduleBlock,
  saveAdminScheduleBlock,
  updateAdminScheduleBlockStatus,
} from "@/app/actions/admin-schedule-blocks";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { DashboardSurfaceNote } from "@/components/dashboard/dashboard-surface-note";
import {
  type AdminScheduleBlockClientOption,
  type AdminScheduleBlockCoachOption,
  type AdminScheduleBlockGroupOption,
  type AdminScheduleBlockRecord,
  type AdminScheduleBlockStat,
} from "@/lib/dashboard/admin-blocks-data";

type BlockFilterStatus = "All" | "Active" | "Paused" | "Archived";
type BlockSessionType = "All" | "Group" | "Private";

type BlockFormState = {
  blockId: string | null;
  title: string;
  description: string;
  sessionType: "GROUP" | "PRIVATE";
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  recurrenceDays: string[];
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  timezone: string;
  coachId: string;
  groupId: string;
  capacity: string;
  location: string;
  clientIds: string[];
  scope: "THIS_AND_FUTURE" | "ENTIRE_SERIES";
};

const scheduleDayOptions = [
  { value: "SUNDAY", label: "Sun" },
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat" },
] as const;

function getBlockTone(status: BlockFilterStatus) {
  switch (status) {
    case "Active":
      return "success";
    case "Paused":
      return "warning";
    case "Archived":
      return "neutral";
    default:
      return "neutral";
  }
}

function getSessionTypeTone(type: "Group" | "Private") {
  return type === "Group" ? "accent" : "neutral";
}

function buildOccurrencePreview(state: BlockFormState) {
  if (!state.startsOn || !state.endsOn || state.recurrenceDays.length === 0) {
    return [] as string[];
  }

  const start = new Date(`${state.startsOn}T00:00:00`);
  const end = new Date(`${state.endsOn}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [] as string[];
  }

  const activeDays = new Set(state.recurrenceDays);
  const labels: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dayKey = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][cursor.getDay()];

    if (activeDays.has(dayKey)) {
      labels.push(
        cursor.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return labels;
}

function toFormState(
  block: AdminScheduleBlockRecord | undefined,
  coachId: string
): BlockFormState {
  if (!block) {
    return {
      blockId: null,
      title: "",
      description: "",
      sessionType: "GROUP",
      status: "ACTIVE",
      recurrenceDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startsOn: "",
      endsOn: "",
      startTime: "18:00",
      endTime: "19:00",
      timezone: "Africa/Cairo",
      coachId,
      groupId: "",
      capacity: "12",
      location: "",
      clientIds: [],
      scope: "THIS_AND_FUTURE",
    };
  }

  return {
    blockId: block.id,
    title: block.title,
    description: block.description,
    sessionType: block.sessionType === "Private" ? "PRIVATE" : "GROUP",
    status:
      block.status === "Paused"
        ? "PAUSED"
        : block.status === "Archived"
          ? "ARCHIVED"
          : "ACTIVE",
    recurrenceDays: block.recurrenceDays,
    startsOn: block.startsOn,
    endsOn: block.endsOn,
    startTime: block.startTime,
    endTime: block.endTime,
    timezone: block.timezone,
    coachId: block.coachId,
    groupId: block.groupId ?? "",
    capacity:
      block.sessionType === "Private"
        ? "1"
        : block.capacityLabel.replace(/\D/g, "") || "12",
    location: block.location === "Studio floor" ? "" : block.location,
    clientIds: block.clientIds,
    scope: "THIS_AND_FUTURE",
  };
}

type AdminBlocksWorkspaceProps = {
  stats: AdminScheduleBlockStat[];
  blockRecords: AdminScheduleBlockRecord[];
  coachOptions: AdminScheduleBlockCoachOption[];
  groupOptions: AdminScheduleBlockGroupOption[];
  clientOptions: AdminScheduleBlockClientOption[];
};

export function AdminBlocksWorkspace({
  stats,
  blockRecords,
  coachOptions,
  groupOptions,
  clientOptions,
}: AdminBlocksWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isMutating, startMutatingTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<BlockFilterStatus>("All");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<BlockSessionType>("All");
  const [selectedBlockId, setSelectedBlockId] = useState(blockRecords[0]?.id ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<BlockFormState>(() =>
    toFormState(undefined, coachOptions[0]?.id ?? "")
  );
  const [candidateClientId, setCandidateClientId] = useState(clientOptions[0]?.id ?? "");
  const [liveClientId, setLiveClientId] = useState(clientOptions[0]?.id ?? "");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredBlocks = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return blockRecords.filter((block) => {
      const matchesQuery =
        query.length === 0 ||
        [
          block.title,
          block.coachName,
          block.groupName,
          block.recurrenceSummary,
          block.note,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All" || block.status === statusFilter;
      const matchesType =
        sessionTypeFilter === "All" || block.sessionType === sessionTypeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [blockRecords, deferredSearchTerm, sessionTypeFilter, statusFilter]);

  const selectedBlock =
    filteredBlocks.find((block) => block.id === selectedBlockId) ?? filteredBlocks[0];
  const selectedCoach = coachOptions.find((coach) => coach.id === selectedBlock?.coachId);
  const previewOccurrences = buildOccurrencePreview(formState);
  const availableDraftClients = clientOptions.filter(
    (client) => !formState.clientIds.includes(client.id)
  );
  const selectedDraftClients = clientOptions.filter((client) =>
    formState.clientIds.includes(client.id)
  );

  const openCreateModal = () => {
    setErrorMessage("");
    setFormState(toFormState(undefined, coachOptions[0]?.id ?? ""));
    setCandidateClientId(availableDraftClients[0]?.id ?? clientOptions[0]?.id ?? "");
    setIsModalOpen(true);
  };

  const openEditModal = (block: AdminScheduleBlockRecord) => {
    setErrorMessage("");
    setFormState(toFormState(block, block.coachId));
    setCandidateClientId(
      clientOptions.find((client) => !block.clientIds.includes(client.id))?.id ??
        clientOptions[0]?.id ??
        ""
    );
    setIsModalOpen(true);
  };

  const handleSaveBlock = () => {
    setErrorMessage("");

    startSaveTransition(async () => {
      try {
        await saveAdminScheduleBlock({
          blockId: formState.blockId,
          title: formState.title,
          description: formState.description,
          sessionType: formState.sessionType,
          status: formState.status,
          recurrenceType: "WEEKLY",
          recurrenceDays: formState.recurrenceDays,
          startsOn: formState.startsOn,
          endsOn: formState.endsOn,
          startTime: formState.startTime,
          endTime: formState.endTime,
          timezone: formState.timezone,
          coachId: formState.coachId,
          groupId: formState.groupId,
          clientIds: formState.clientIds,
          location: formState.location,
          capacity:
            formState.sessionType === "PRIVATE"
              ? 1
              : formState.capacity.trim() === ""
                ? null
                : Number(formState.capacity),
          scope: formState.scope,
        });
        setIsModalOpen(false);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save schedule block."
        );
      }
    });
  };

  const handleStatusChange = (
    blockId: string,
    nextStatus: "ACTIVE" | "PAUSED" | "ARCHIVED"
  ) => {
    setErrorMessage("");

    startMutatingTransition(async () => {
      try {
        await updateAdminScheduleBlockStatus(blockId, nextStatus);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not update block status."
        );
      }
    });
  };

  const handleAddClientToLiveBlock = () => {
    if (!selectedBlock || !liveClientId) {
      return;
    }

    setErrorMessage("");

    startMutatingTransition(async () => {
      try {
        await addClientToAdminScheduleBlock(selectedBlock.id, liveClientId);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not add client to block."
        );
      }
    });
  };

  const handleRemoveClientFromLiveBlock = (clientId: string) => {
    if (!selectedBlock) {
      return;
    }

    setErrorMessage("");

    startMutatingTransition(async () => {
      try {
        await removeClientFromAdminScheduleBlock(selectedBlock.id, clientId);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not remove client from block."
        );
      }
    });
  };

  const blockCount = filteredBlocks.length;
  const activeCount = filteredBlocks.filter((block) => block.status === "Active").length;
  const conflictCount = filteredBlocks.reduce(
    (total, block) => total + block.conflicts.length,
    0
  );

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Blocks & groups"
        actions={
          <button type="button" className="mv-btn mv-btn-primary" onClick={openCreateModal}>
            <CalendarPlus2 size={16} />
            Create Block
          </button>
        }
      />

      <DashboardSurfaceNote
        eyebrow="Recurring structure"
        title={
          conflictCount > 0
            ? `${conflictCount} coach conflict${conflictCount === 1 ? "" : "s"} need review in the current block view.`
            : "Recurring blocks are organized enough to focus on roster quality and coach load."
        }
        description="Build the weekly structure here, then manage one-off exceptions from sessions or the live schedule."
        items={[
          `${blockCount} blocks are visible in this filtered view.`,
          `${activeCount} blocks are actively generating occurrences.`,
          `${clientOptions.filter((client) => !client.currentBlockId).length} clients still need a recurring block.`,
        ]}
      />

      <section className="dashboard-kpi-grid">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
          <DashboardManagementToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by block, coach, group, or note"
            summary={`${filteredBlocks.length} blocks in view`}
            filters={
              <>
                <label className="dashboard-filter-field">
                  <span>Status</span>
                  <select
                    className="dashboard-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as BlockFilterStatus)}
                  >
                    {["All", "Active", "Paused", "Archived"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Type</span>
                  <select
                    className="dashboard-select"
                    value={sessionTypeFilter}
                    onChange={(event) =>
                      setSessionTypeFilter(event.target.value as BlockSessionType)
                    }
                  >
                    {["All", "Group", "Private"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            }
          />

          <div className="dashboard-data-region">
            {filteredBlocks.length > 0 ? (
              <div className="dashboard-mobile-list dashboard-mobile-list--always">
                {filteredBlocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    className={
                      selectedBlock?.id === block.id
                        ? "dashboard-record-card dashboard-record-card--active dashboard-block-card"
                        : "dashboard-record-card dashboard-block-card"
                    }
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <div className="dashboard-record-card__header">
                      <div>
                        <span className="dashboard-record-card__eyebrow">
                          {block.recurrenceSummary}
                        </span>
                        <h3>{block.title}</h3>
                        <p>{block.note}</p>
                      </div>
                      <div className="dashboard-badge-stack">
                        <DashboardStatusBadge
                          label={block.sessionType}
                          tone={getSessionTypeTone(block.sessionType)}
                        />
                        <DashboardStatusBadge
                          label={block.status}
                          tone={getBlockTone(block.status)}
                        />
                      </div>
                    </div>

                    <div className="dashboard-record-card__meta">
                      <span>{block.coachName}</span>
                      <span>{block.groupName}</span>
                      <span>{block.capacityLabel}</span>
                      <span>{block.rosterCount} rostered</span>
                    </div>

                    <p className="dashboard-record-card__note">
                      Next: {block.nextOccurrenceLabel}
                    </p>

                    {block.conflicts.length > 0 ? (
                      <div className="dashboard-panel__meta-strip">
                        <span>{block.conflicts.length} conflict warnings</span>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="No recurring blocks match this view"
                description="Adjust the filters or create the first weekly block."
              />
            )}
          </div>
        </article>

        <aside className="dashboard-panel dashboard-detail-panel dashboard-panel--dense">
          {selectedBlock ? (
            <>
              <div className="dashboard-panel__header dashboard-panel__header--tight">
                <div>
                  <div className="mv-eyebrow">Selected block</div>
                  <h2>{selectedBlock.title}</h2>
                  <p>{selectedBlock.note}</p>
                </div>
                <div className="dashboard-badge-stack">
                  <DashboardStatusBadge
                    label={selectedBlock.sessionType}
                    tone={getSessionTypeTone(selectedBlock.sessionType)}
                  />
                  <DashboardStatusBadge
                    label={selectedBlock.status}
                    tone={getBlockTone(selectedBlock.status)}
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="dashboard-empty-state" role="alert">
                  <strong>Action blocked</strong>
                  <p>{errorMessage}</p>
                </div>
              ) : null}

              <div className="dashboard-row-actions">
                <button
                  type="button"
                  className="mv-btn mv-btn-secondary"
                  onClick={() => openEditModal(selectedBlock)}
                >
                  <SquareStack size={16} />
                  Edit Block
                </button>
                <button
                  type="button"
                  className="mv-btn mv-btn-outline"
                  onClick={() => {
                    setFormState({
                      ...toFormState(selectedBlock, selectedBlock.coachId),
                      blockId: null,
                      title: `${selectedBlock.title} Copy`,
                    });
                    setErrorMessage("");
                    setIsModalOpen(true);
                  }}
                >
                  <Copy size={16} />
                  Duplicate Draft
                </button>
                {selectedBlock.status === "Active" ? (
                  <button
                    type="button"
                    className="mv-btn mv-btn-outline"
                    onClick={() =>
                      handleStatusChange(selectedBlock.id, "PAUSED")
                    }
                    disabled={isMutating}
                  >
                    <Pause size={16} />
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mv-btn mv-btn-outline"
                    onClick={() =>
                      handleStatusChange(selectedBlock.id, "ACTIVE")
                    }
                    disabled={isMutating}
                  >
                    <Play size={16} />
                    Resume
                  </button>
                )}
                <button
                  type="button"
                  className="mv-btn mv-btn-danger"
                  onClick={() =>
                    handleStatusChange(selectedBlock.id, "ARCHIVED")
                  }
                  disabled={isMutating}
                >
                  <Trash2 size={16} />
                  Archive
                </button>
              </div>

              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Coach</span>
                  <strong>{selectedBlock.coachName}</strong>
                  <small>{selectedCoach?.sessionsThisWeek ?? 0} sessions this week</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Group</span>
                  <strong>{selectedBlock.groupName}</strong>
                  <small>{selectedBlock.recurrenceSummary}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Range</span>
                  <strong>{selectedBlock.activeDateRange}</strong>
                  <small>{selectedBlock.totalUpcomingOccurrences} future occurrences</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Roster</span>
                  <strong>{selectedBlock.rosterCount}</strong>
                  <small>{selectedBlock.capacityLabel}</small>
                </div>
              </div>

              <div className="dashboard-summary-list">
                <div className="dashboard-summary-row">
                  <strong>Upcoming generated occurrences</strong>
                  <span>Use sessions and schedule pages to handle one-off exceptions.</span>
                </div>
                {selectedBlock.upcomingOccurrences.map((occurrence) => (
                  <div key={occurrence.id} className="dashboard-summary-row">
                    <strong>
                      {occurrence.dateLabel} · {occurrence.timeLabel}
                    </strong>
                    <span>
                      {occurrence.occupancyLabel} · {occurrence.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">Roster</div>
                    <h3>Clients on this block</h3>
                    <p>Changes here update the future recurring roster automatically.</p>
                  </div>
                </div>

                <div className="dashboard-form-grid">
                  <label className="dashboard-form-field">
                    <span>Add client</span>
                    <select
                      className="dashboard-select"
                      value={liveClientId}
                      onChange={(event) => setLiveClientId(event.target.value)}
                      disabled={isMutating}
                    >
                      {clientOptions.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName} · {client.currentBlockName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="mv-btn mv-btn-primary"
                    onClick={handleAddClientToLiveBlock}
                    disabled={isMutating || !liveClientId}
                  >
                    {isMutating ? "Saving..." : "Add to block"}
                  </button>
                </div>

                {selectedBlock.clients.length > 0 ? (
                  <div className="dashboard-summary-list">
                    {selectedBlock.clients.map((client) => (
                      <div key={client.id} className="dashboard-summary-row">
                        <strong>{client.fullName}</strong>
                        <span>{client.nextSession}</span>
                        <div className="dashboard-row-actions">
                          <button
                            type="button"
                            className="dashboard-inline-button"
                            onClick={() => handleRemoveClientFromLiveBlock(client.id)}
                            disabled={isMutating}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    title="No clients are attached to this block yet"
                    description="Add the first roster member to generate future block bookings."
                  />
                )}
              </div>

              {selectedBlock.conflicts.length > 0 ? (
                <div className="dashboard-form-section">
                  <div className="dashboard-form-section__header">
                    <div>
                      <div className="mv-eyebrow">Coach conflicts</div>
                      <h3>Conflicting future sessions</h3>
                      <p>Move or reassign these overlapping occurrences before final testing.</p>
                    </div>
                  </div>
                  <div className="dashboard-summary-list">
                    {selectedBlock.conflicts.map((conflict) => (
                      <div key={conflict} className="dashboard-summary-row">
                        <strong>{conflict}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <DashboardEmptyState
              title="No block selected"
              description="Choose a recurring block to inspect roster, coach coverage, and occurrences."
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
        title={formState.blockId ? "Edit schedule block" : "Create schedule block"}
        description="Build the recurring structure once, then let the schedule generate the occurrences."
        size="wide"
        footer={
          <>
            <button
              type="button"
              className="mv-btn mv-btn-outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={handleSaveBlock}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : formState.blockId ? "Save block" : "Create block"}
            </button>
          </>
        }
      >
        {errorMessage ? (
          <div className="dashboard-empty-state" role="alert">
            <strong>Could not save block</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div className="dashboard-stack">
          <div className="dashboard-form-section">
            <div className="dashboard-form-section__header">
              <div>
                <div className="mv-eyebrow">Step 1</div>
                <h3>Choose the structure</h3>
                <p>Define what repeats and who owns the block.</p>
              </div>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-form-field">
                <span>Block title</span>
                <input
                  className="dashboard-input"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Session type</span>
                <select
                  className="dashboard-select"
                  value={formState.sessionType}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      sessionType: event.target.value as "GROUP" | "PRIVATE",
                      capacity:
                        event.target.value === "PRIVATE" ? "1" : current.capacity || "12",
                    }))
                  }
                >
                  <option value="GROUP">Group</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Coach</span>
                <select
                  className="dashboard-select"
                  value={formState.coachId}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      coachId: event.target.value,
                    }))
                  }
                >
                  {coachOptions.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.fullName} · {coach.sessionsThisWeek} sessions this week
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-form-field">
                <span>Linked group</span>
                <select
                  className="dashboard-select"
                  value={formState.groupId}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      groupId: event.target.value,
                    }))
                  }
                >
                  <option value="">No linked group</option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} · {group.memberCount} members
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="dashboard-form-section">
            <div className="dashboard-form-section__header">
              <div>
                <div className="mv-eyebrow">Step 2</div>
                <h3>Define recurrence</h3>
                <p>Start date, end date, and repeating weekdays.</p>
              </div>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-form-field">
                <span>Start date</span>
                <input
                  type="date"
                  className="dashboard-input"
                  value={formState.startsOn}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      startsOn: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>End date</span>
                <input
                  type="date"
                  className="dashboard-input"
                  value={formState.endsOn}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      endsOn: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Start time</span>
                <input
                  type="time"
                  className="dashboard-input"
                  value={formState.startTime}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>End time</span>
                <input
                  type="time"
                  className="dashboard-input"
                  value={formState.endTime}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="dashboard-row-actions dashboard-day-picker">
              {scheduleDayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={
                    formState.recurrenceDays.includes(day.value)
                      ? "dashboard-day-chip dashboard-day-chip--active"
                      : "dashboard-day-chip"
                  }
                  onClick={() =>
                    setFormState((current) => ({
                      ...current,
                      recurrenceDays: current.recurrenceDays.includes(day.value)
                        ? current.recurrenceDays.filter((value) => value !== day.value)
                        : [...current.recurrenceDays, day.value],
                    }))
                  }
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-form-section">
            <div className="dashboard-form-section__header">
              <div>
                <div className="mv-eyebrow">Step 3</div>
                <h3>Attach roster and settings</h3>
                <p>Set block defaults and build the recurring roster.</p>
              </div>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-form-field">
                <span>Capacity</span>
                <input
                  type="number"
                  min={1}
                  max={formState.sessionType === "PRIVATE" ? 1 : 50}
                  disabled={formState.sessionType === "PRIVATE"}
                  className="dashboard-input"
                  value={formState.sessionType === "PRIVATE" ? "1" : formState.capacity}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      capacity: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Location</span>
                <input
                  className="dashboard-input"
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="dashboard-form-field">
                <span>Status</span>
                <select
                  className="dashboard-select"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      status: event.target.value as "ACTIVE" | "PAUSED" | "ARCHIVED",
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </label>
              {formState.blockId ? (
                <label className="dashboard-form-field">
                  <span>Edit scope</span>
                  <select
                    className="dashboard-select"
                    value={formState.scope}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        scope: event.target.value as "THIS_AND_FUTURE" | "ENTIRE_SERIES",
                      }))
                    }
                  >
                    <option value="THIS_AND_FUTURE">This and future</option>
                    <option value="ENTIRE_SERIES">Entire series</option>
                  </select>
                </label>
              ) : null}
              <label className="dashboard-form-field dashboard-form-field--wide">
                <span>Description</span>
                <input
                  className="dashboard-input"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="dashboard-form-grid">
              <label className="dashboard-form-field">
                <span>Add draft client</span>
                <select
                  className="dashboard-select"
                  value={candidateClientId}
                  onChange={(event) => setCandidateClientId(event.target.value)}
                >
                  {availableDraftClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName} · {client.currentBlockName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="dashboard-row-actions">
              <button
                type="button"
                className="mv-btn mv-btn-outline"
                onClick={() => {
                  if (!candidateClientId) {
                    return;
                  }

                  setFormState((current) => ({
                    ...current,
                    clientIds: [...current.clientIds, candidateClientId],
                  }));
                  setCandidateClientId(
                    availableDraftClients.find((client) => client.id !== candidateClientId)?.id ??
                      ""
                  );
                }}
                disabled={!candidateClientId}
              >
                Add draft client
              </button>
            </div>

            {selectedDraftClients.length > 0 ? (
              <div className="dashboard-summary-list">
                {selectedDraftClients.map((client) => (
                  <div key={client.id} className="dashboard-summary-row">
                    <strong>{client.fullName}</strong>
                    <span>{client.nextSession}</span>
                    <div className="dashboard-row-actions">
                      <button
                        type="button"
                        className="dashboard-inline-button"
                        onClick={() =>
                          setFormState((current) => ({
                            ...current,
                            clientIds: current.clientIds.filter((id) => id !== client.id),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="No draft roster yet"
                description="Add clients now or link a group and fill the roster later."
              />
            )}
          </div>

          <div className="dashboard-form-section">
            <div className="dashboard-form-section__header">
              <div>
                <div className="mv-eyebrow">Step 4</div>
                <h3>Preview generated structure</h3>
                <p>These are the first dates that will be generated from the block rule.</p>
              </div>
            </div>

            <div className="dashboard-panel__meta-strip">
              <span>{previewOccurrences.length} generated dates</span>
              <span>{formState.clientIds.length} rostered clients</span>
              <span>
                {coachOptions.find((coach) => coach.id === formState.coachId)?.sessionsThisWeek ?? 0}{" "}
                sessions already this week
              </span>
            </div>

            {previewOccurrences.length > 0 ? (
              <div className="dashboard-summary-list">
                {previewOccurrences.slice(0, 8).map((label) => (
                  <div key={label} className="dashboard-summary-row">
                    <strong>{label}</strong>
                    <span>
                      {formState.startTime} - {formState.endTime} · {formState.location || "Studio floor"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="Preview will appear after dates and weekdays are selected"
                description="Choose a valid date range and at least one recurrence day."
              />
            )}
          </div>
        </div>
      </DashboardModal>
    </div>
  );
}
