"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarPlus2, XCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  bulkUpdateAdminSessions,
  cancelAdminSession,
  saveAdminSession,
} from "@/app/actions/admin-sessions";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardManagementToolbar } from "@/components/dashboard/dashboard-management-toolbar";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import type {
  AdminScheduleSessionRecord,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";
import type {
  AdminScheduleBlockOption,
  AdminScheduleGroupOption,
} from "@/lib/repositories/admin-schedule-repository";

type BulkAction = "CANCEL" | "REASSIGN_COACH" | "UPDATE_LOCATION" | "UPDATE_CAPACITY";

function getScheduleTone(status: AdminScheduleSessionRecord["status"]) {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Waitlist":
      return "warning";
    case "Attention":
      return "accent";
    default:
      return "neutral";
  }
}

function getSessionTypeTone(type: AdminScheduleSessionRecord["sessionType"]) {
  return type === "Group" ? "accent" : "neutral";
}

function getWeekdayOrder(day: string) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(
    day
  );
}

function formatHourLabel(hour: number) {
  const value = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${value} ${suffix}`;
}

type AdminScheduleWorkspaceProps = {
  stats: AdminScheduleStat[];
  records: AdminScheduleSessionRecord[];
  coachOptions: AdminSessionCoachOption[];
  blockOptions: AdminScheduleBlockOption[];
  groupOptions: AdminScheduleGroupOption[];
};

export function AdminScheduleWorkspace({
  stats,
  records,
  coachOptions,
  blockOptions,
  groupOptions,
}: AdminScheduleWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] =
    useState<AdminScheduleSessionRecord["status"] | "All">("All");
  const [typeFilter, setTypeFilter] =
    useState<AdminScheduleSessionRecord["sessionType"] | "All">("All");
  const [coachFilter, setCoachFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedSessionId, setSelectedSessionId] = useState(records[0]?.id ?? "");
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("CANCEL");
  const [bulkCoachId, setBulkCoachId] = useState(coachOptions[0]?.id ?? "");
  const [bulkLocation, setBulkLocation] = useState("");
  const [bulkCapacity, setBulkCapacity] = useState("12");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMutating, startMutatingTransition] = useTransition();
  const [occurrenceCoachId, setOccurrenceCoachId] = useState(coachOptions[0]?.id ?? "");

  const handleCancelOccurrence = (sessionId: string) => {
    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await cancelAdminSession(sessionId);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not cancel occurrence."
        );
      }
    });
  };

  const handleReassignOccurrenceCoach = (session: AdminScheduleSessionRecord) => {
    if (!occurrenceCoachId || occurrenceCoachId === session.coachId) {
      return;
    }

    setErrorMessage("");
    startMutatingTransition(async () => {
      try {
        await saveAdminSession({
          sessionId: session.id,
          title: session.title,
          type: session.sessionType === "Group" ? "GROUP" : "PRIVATE",
          status:
            session.status === "Confirmed" || session.status === "Waitlist"
              ? "SCHEDULED"
              : session.status === "Completed"
                ? "COMPLETED"
                : "DRAFT",
          coachId: occurrenceCoachId,
          location: session.location,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          capacity: session.capacity,
        });
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not reassign coach."
        );
      }
    });
  };

  const filteredRecords = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const matchesQuery =
        query.length === 0 ||
        [
          record.title,
          record.coachName,
          record.groupName,
          record.scheduleBlockTitle,
          record.focus,
          record.location,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesType = typeFilter === "All" || record.sessionType === typeFilter;
      const matchesCoach = coachFilter === "all" || record.coachId === coachFilter;
      const matchesBlock =
        blockFilter === "all" ||
        (blockFilter === "manual"
          ? record.scheduleBlockId === null
          : record.scheduleBlockId === blockFilter);
      const matchesGroup =
        groupFilter === "all" ||
        (groupFilter === "none"
          ? record.groupName === "No linked group"
          : record.groupName === groupOptions.find((group) => group.id === groupFilter)?.name);

      return (
        matchesQuery &&
        matchesStatus &&
        matchesType &&
        matchesCoach &&
        matchesBlock &&
        matchesGroup
      );
    });
  }, [
    blockFilter,
    coachFilter,
    deferredSearchTerm,
    groupFilter,
    groupOptions,
    records,
    statusFilter,
    typeFilter,
  ]);

  const weekDays = useMemo(() => {
    const uniqueDays = Array.from(new Set(filteredRecords.map((record) => record.dayLabel)));
    return uniqueDays.sort((left, right) => getWeekdayOrder(left) - getWeekdayOrder(right));
  }, [filteredRecords]);

  const selectedSession =
    filteredRecords.find((record) => record.id === selectedSessionId) ?? filteredRecords[0];
  const selectedBlockSessions = selectedSession?.scheduleBlockId
    ? filteredRecords
        .filter((record) => record.scheduleBlockId === selectedSession.scheduleBlockId)
        .slice(0, 4)
    : [];

  const handleToggleSelection = (sessionId: string) => {
    setSelectedSessionIds((current) =>
      current.includes(sessionId)
        ? current.filter((value) => value !== sessionId)
        : [...current, sessionId]
    );
  };

  const handleApplyBulkAction = () => {
    if (selectedSessionIds.length === 0) {
      return;
    }

    setErrorMessage("");

    startSaveTransition(async () => {
      try {
        await bulkUpdateAdminSessions({
          sessionIds: selectedSessionIds,
          action: bulkAction,
          coachId: bulkAction === "REASSIGN_COACH" ? bulkCoachId : undefined,
          location: bulkAction === "UPDATE_LOCATION" ? bulkLocation : undefined,
          capacity:
            bulkAction === "UPDATE_CAPACITY"
              ? Number(bulkCapacity)
              : undefined,
        });
        setSelectedSessionIds([]);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not apply the bulk update."
        );
      }
    });
  };

  const earliestHour = Math.max(
    6,
    Math.min(
      22,
      ...filteredRecords.map((record) => new Date(record.startsAt).getHours())
    )
  );
  const latestHour = Math.min(
    23,
    Math.max(
      earliestHour + 8,
      ...filteredRecords.map((record) => new Date(record.endsAt).getHours() + 1)
    )
  );
  const hourLabels = Array.from(
    { length: latestHour - earliestHour + 1 },
    (_, index) => earliestHour + index
  );
  const hourHeight = 72;

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Admin schedule"
        actions={
          <Link href="/admin/blocks" className="mv-btn mv-btn-primary">
            <CalendarPlus2 size={16} />
            Create Block
          </Link>
        }
      />

      <section className="dashboard-kpi-grid">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.id} {...stat} />
        ))}
      </section>

      <section className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <DashboardManagementToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by session, coach, group, block, or location"
          summary={`${filteredRecords.length} occurrences in the current view`}
          filters={
            <>
              <label className="dashboard-filter-field">
                <span>Status</span>
                <select
                  className="dashboard-select"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as AdminScheduleSessionRecord["status"] | "All"
                    )
                  }
                >
                  {["All", "Confirmed", "Waitlist", "Attention", "Completed"].map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </select>
              </label>
              <label className="dashboard-filter-field">
                <span>Type</span>
                <select
                  className="dashboard-select"
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as AdminScheduleSessionRecord["sessionType"] | "All"
                    )
                  }
                >
                  {["All", "Group", "Private"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-filter-field">
                <span>Coach</span>
                <select
                  className="dashboard-select"
                  value={coachFilter}
                  onChange={(event) => setCoachFilter(event.target.value)}
                >
                  <option value="all">All coaches</option>
                  {coachOptions.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-filter-field">
                <span>Block</span>
                <select
                  className="dashboard-select"
                  value={blockFilter}
                  onChange={(event) => setBlockFilter(event.target.value)}
                >
                  <option value="all">All blocks</option>
                  <option value="manual">Manual sessions</option>
                  {blockOptions.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-filter-field">
                <span>Group</span>
                <select
                  className="dashboard-select"
                  value={groupFilter}
                  onChange={(event) => setGroupFilter(event.target.value)}
                >
                  <option value="all">All groups</option>
                  <option value="none">No linked group</option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          }
        />

        <div className="dashboard-schedule-grid">
          <div className="dashboard-schedule-grid__hours">
            {hourLabels.map((hour) => (
              <div
                key={hour}
                className="dashboard-schedule-grid__hour"
                style={{ height: `${hourHeight}px` }}
              >
                <span>{formatHourLabel(hour)}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-schedule-grid__days">
            {weekDays.map((day) => {
              const dayRecords = filteredRecords.filter((record) => record.dayLabel === day);

              return (
                <section key={day} className="dashboard-schedule-grid__day">
                  <header className="dashboard-schedule-grid__day-header">
                    <strong>{day}</strong>
                    <span>{dayRecords.length} occurrences</span>
                  </header>
                  <div
                    className="dashboard-schedule-grid__day-body"
                    style={{ height: `${hourLabels.length * hourHeight}px` }}
                  >
                    {hourLabels.map((hour) => (
                      <div
                        key={`${day}-${hour}`}
                        className="dashboard-schedule-grid__line"
                        style={{ top: `${(hour - earliestHour) * hourHeight}px` }}
                      />
                    ))}

                    {dayRecords.map((record) => {
                      const start = new Date(record.startsAt);
                      const end = new Date(record.endsAt);
                      const startOffset =
                        (start.getHours() - earliestHour) * hourHeight +
                        (start.getMinutes() / 60) * hourHeight;
                      const duration =
                        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                      return (
                        <button
                          key={record.id}
                          type="button"
                          className={
                            selectedSession?.id === record.id
                              ? "dashboard-schedule-grid__event dashboard-schedule-grid__event--active"
                              : "dashboard-schedule-grid__event"
                          }
                          style={{
                            top: `${startOffset}px`,
                            height: `${Math.max(duration * hourHeight, 52)}px`,
                          }}
                          onClick={() => setSelectedSessionId(record.id)}
                        >
                          <div className="dashboard-schedule-grid__event-top">
                            <input
                              type="checkbox"
                              checked={selectedSessionIds.includes(record.id)}
                              onChange={() => handleToggleSelection(record.id)}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <div className="dashboard-schedule-grid__event-badges">
                              <DashboardStatusBadge
                                label={record.sessionType}
                                tone={getSessionTypeTone(record.sessionType)}
                              />
                              <DashboardStatusBadge
                                label={record.status}
                                tone={getScheduleTone(record.status)}
                              />
                            </div>
                          </div>
                          <strong>{record.title}</strong>
                          <span>{record.timeRange}</span>
                          <small>{record.coachName}</small>
                          <small>{record.occupancyLabel}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Occurrence detail</div>
              <h2>{selectedSession?.title ?? "No session selected"}</h2>
              <p>{selectedSession?.focus ?? "Pick an occurrence from the week grid."}</p>
            </div>
            {selectedSession ? (
              <div className="dashboard-badge-stack">
                <DashboardStatusBadge
                  label={selectedSession.sessionType}
                  tone={getSessionTypeTone(selectedSession.sessionType)}
                />
                <DashboardStatusBadge
                  label={selectedSession.status}
                  tone={getScheduleTone(selectedSession.status)}
                />
                {selectedSession.waitlistCount > 0 ? (
                  <DashboardStatusBadge label="Waitlist forming" tone="warning" />
                ) : null}
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="dashboard-empty-state" role="alert">
              <strong>Action blocked</strong>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {selectedSession ? (
            <>
              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Block</span>
                  <strong>{selectedSession.scheduleBlockTitle}</strong>
                  <small>{selectedSession.highlight}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Group</span>
                  <strong>{selectedSession.groupName}</strong>
                  <small>{selectedSession.rosterCount} rostered</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Coach</span>
                  <strong>{selectedSession.coachName}</strong>
                  <small>{selectedSession.location}</small>
                </div>
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Occupancy</span>
                  <strong>{selectedSession.occupancyLabel}</strong>
                  <small>
                    {selectedSession.bookedCount} booked · {selectedSession.waitlistCount} waitlist
                  </small>
                </div>
              </div>

              <div className="dashboard-form-section">
                <div className="dashboard-form-section__header">
                  <div>
                    <div className="mv-eyebrow">This occurrence only</div>
                    <h3>Quick actions</h3>
                    <p>Changes here apply to this single occurrence, not the series.</p>
                  </div>
                </div>

                <div className="dashboard-form-grid">
                  <label className="dashboard-form-field">
                    <span>Replace coach</span>
                    <select
                      className="dashboard-select"
                      value={occurrenceCoachId}
                      onChange={(event) => setOccurrenceCoachId(event.target.value)}
                      disabled={isMutating}
                    >
                      {coachOptions.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.fullName}
                          {coach.id === selectedSession.coachId ? " (current)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="dashboard-row-actions">
                  <button
                    type="button"
                    className="mv-btn mv-btn-secondary"
                    onClick={() => handleReassignOccurrenceCoach(selectedSession)}
                    disabled={isMutating || occurrenceCoachId === selectedSession.coachId}
                  >
                    <RefreshCw size={16} />
                    {isMutating ? "Saving..." : "Reassign coach"}
                  </button>
                  {selectedSession.status !== "Completed" ? (
                    <button
                      type="button"
                      className="mv-btn mv-btn-danger"
                      onClick={() => handleCancelOccurrence(selectedSession.id)}
                      disabled={isMutating}
                    >
                      <XCircle size={16} />
                      Cancel occurrence
                    </button>
                  ) : null}
                  {selectedSession.scheduleBlockId ? (
                    <Link
                      href="/admin/blocks"
                      className="mv-btn mv-btn-outline"
                    >
                      Open parent block
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Admin note</span>
                <p>{selectedSession.attendanceNote}</p>
              </div>

              {selectedBlockSessions.length > 1 ? (
                <div className="dashboard-summary-list">
                  <div className="dashboard-summary-row">
                    <strong>Linked block occurrences</strong>
                    <span>Next occurrences from the same recurring block.</span>
                  </div>
                  {selectedBlockSessions.map((record) => (
                    <div key={record.id} className="dashboard-summary-row">
                      <strong>
                        {record.dateLabel} · {record.timeRange}
                      </strong>
                      <span>
                        {record.occupancyLabel} · {record.coachName}
                      </span>
                      <DashboardStatusBadge
                        label={record.status}
                        tone={getScheduleTone(record.status)}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <DashboardEmptyState
              title="No occurrence available"
              description="Adjust the filters or create a block to populate the board."
            />
          )}
        </article>

        <aside className="dashboard-panel dashboard-detail-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Bulk actions</div>
              <h2>{selectedSessionIds.length} selected</h2>
              <p>Apply one operational change across multiple occurrences at once.</p>
            </div>
          </div>

          {errorMessage ? (
            <div className="dashboard-empty-state" role="alert">
              <strong>Bulk update blocked</strong>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="dashboard-form-grid">
            <label className="dashboard-form-field">
              <span>Action</span>
              <select
                className="dashboard-select"
                value={bulkAction}
                onChange={(event) => setBulkAction(event.target.value as BulkAction)}
              >
                <option value="CANCEL">Cancel selected</option>
                <option value="REASSIGN_COACH">Replace coach</option>
                <option value="UPDATE_LOCATION">Change location</option>
                <option value="UPDATE_CAPACITY">Change capacity</option>
              </select>
            </label>

            {bulkAction === "REASSIGN_COACH" ? (
              <label className="dashboard-form-field">
                <span>Coach</span>
                <select
                  className="dashboard-select"
                  value={bulkCoachId}
                  onChange={(event) => setBulkCoachId(event.target.value)}
                >
                  {coachOptions.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.fullName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {bulkAction === "UPDATE_LOCATION" ? (
              <label className="dashboard-form-field">
                <span>Location</span>
                <input
                  className="dashboard-input"
                  value={bulkLocation}
                  onChange={(event) => setBulkLocation(event.target.value)}
                />
              </label>
            ) : null}

            {bulkAction === "UPDATE_CAPACITY" ? (
              <label className="dashboard-form-field">
                <span>Capacity</span>
                <input
                  type="number"
                  min={1}
                  className="dashboard-input"
                  value={bulkCapacity}
                  onChange={(event) => setBulkCapacity(event.target.value)}
                />
              </label>
            ) : null}
          </div>

          <div className="dashboard-row-actions">
            <button
              type="button"
              className="mv-btn mv-btn-primary"
              onClick={handleApplyBulkAction}
              disabled={isSaving || selectedSessionIds.length === 0}
            >
              {isSaving ? "Applying..." : "Apply bulk action"}
            </button>
          </div>

          {selectedSessionIds.length > 0 ? (
            <div className="dashboard-summary-list">
              {filteredRecords
                .filter((record) => selectedSessionIds.includes(record.id))
                .map((record) => (
                  <div key={record.id} className="dashboard-summary-row">
                    <strong>{record.title}</strong>
                    <span>
                      {record.dateLabel} · {record.timeRange} · {record.coachName}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No occurrences selected"
              description="Use the checkboxes on the week grid to build a bulk edit set."
            />
          )}
        </aside>
      </section>
    </div>
  );
}
