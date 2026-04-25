"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarPlus2, XCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
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

const cairoDayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const cairoDayCircleFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo",
  weekday: "short",
  month: "short",
  day: "numeric",
});

const cairoDayHeadingFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo",
  weekday: "long",
  month: "long",
  day: "numeric",
});

function getCairoDayKey(dateValue: string) {
  return cairoDayKeyFormatter.format(new Date(dateValue));
}

function getDayCircleParts(dateValue: string) {
  const parts = cairoDayCircleFormatter
    .formatToParts(new Date(dateValue))
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return {
    weekday: parts.weekday ?? "",
    month: parts.month ?? "",
    day: parts.day ?? "",
  };
}

type AdminScheduleWorkspaceProps = {
  stats: AdminScheduleStat[];
  records: AdminScheduleSessionRecord[];
  coachOptions: AdminSessionCoachOption[];
  groupOptions: AdminScheduleGroupOption[];
};

export function AdminScheduleWorkspace({
  stats,
  records,
  coachOptions,
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
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);

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
          record.focus,
          record.location,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesType = typeFilter === "All" || record.sessionType === typeFilter;
      const matchesCoach = coachFilter === "all" || record.coachId === coachFilter;
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
        matchesGroup
      );
    });
  }, [
    coachFilter,
    deferredSearchTerm,
    groupFilter,
    groupOptions,
    records,
    statusFilter,
    typeFilter,
  ]);

  const dayBuckets = useMemo(() => {
    const grouped = new Map<string, AdminScheduleSessionRecord[]>();

    for (const record of filteredRecords) {
      const dayKey = getCairoDayKey(record.startsAt);
      const existing = grouped.get(dayKey);
      if (existing) {
        existing.push(record);
      } else {
        grouped.set(dayKey, [record]);
      }
    }

    return Array.from(grouped.entries())
      .map(([key, dayRecords]) => {
        const sortedRecords = [...dayRecords].sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()
        );

        const firstRecord = sortedRecords[0];
        const circleParts = getDayCircleParts(firstRecord.startsAt);

        return {
          key,
          label: cairoDayHeadingFormatter.format(new Date(firstRecord.startsAt)),
          weekdayShort: circleParts.weekday,
          monthShort: circleParts.month,
          dayNumber: circleParts.day,
          records: sortedRecords,
        };
      })
      .sort((left, right) => left.key.localeCompare(right.key));
  }, [filteredRecords]);

  const selectedSession =
    filteredRecords.find((record) => record.id === selectedSessionId) ?? filteredRecords[0];
  const selectedDayBucket =
    dayBuckets.find((bucket) => bucket.key === selectedDayKey) ?? dayBuckets[0];
  const selectedDayRecords = useMemo(
    () => selectedDayBucket?.records ?? [],
    [selectedDayBucket]
  );
  const recordsByDay = new Map<string, AdminScheduleSessionRecord[]>();
  const weekDays: string[] = [];
  const isAllCollapsed = false;

  useEffect(() => {
    if (selectedSession?.coachId) {
      setOccurrenceCoachId(selectedSession.coachId);
    }
  }, [selectedSession?.id, selectedSession?.coachId]);

  useEffect(() => {
    if (dayBuckets.length === 0) {
      setSelectedDayKey("");
      return;
    }

    if (!dayBuckets.some((bucket) => bucket.key === selectedDayKey)) {
      setSelectedDayKey(dayBuckets[0].key);
    }
  }, [dayBuckets, selectedDayKey]);

  useEffect(() => {
    if (!selectedDayBucket || selectedDayRecords.length === 0) {
      return;
    }

    if (!selectedDayRecords.some((record) => record.id === selectedSessionId)) {
      setSelectedSessionId(selectedDayRecords[0].id);
    }
  }, [selectedDayBucket, selectedDayRecords, selectedSessionId]);

  const handleToggleSelection = (sessionId: string) => {
    setSelectedSessionIds((current) =>
      current.includes(sessionId)
        ? current.filter((value) => value !== sessionId)
        : [...current, sessionId]
    );
  };

  const handleToggleDay = (day: string) => {
    setCollapsedDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day]
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

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <DashboardPageHeader
        eyebrow="Admin schedule"
        actions={
          <Link href="/admin/sessions" className="mv-btn mv-btn-primary">
            <CalendarPlus2 size={16} />
            Create Session
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
          searchPlaceholder="Search by session, coach, group, or location"
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

        {filteredRecords.length > 0 ? (
          <div className="dashboard-schedule-dayline">
            <div className="dashboard-schedule-dayline__actions">
              <p>
                {dayBuckets.length} days - {filteredRecords.length} occurrences
              </p>
              <span>{selectedDayBucket?.label ?? "Select a day"}</span>
            </div>

            <div className="dashboard-schedule-dayline__days" role="tablist" aria-label="Schedule days">
              {dayBuckets.map((day) => {
                const isActive = selectedDayBucket?.key === day.key;

                return (
                  <button
                    key={day.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={
                      isActive
                        ? "dashboard-schedule-dayline__day dashboard-schedule-dayline__day--active"
                        : "dashboard-schedule-dayline__day"
                    }
                    onClick={() => setSelectedDayKey(day.key)}
                  >
                    <small>{day.weekdayShort}</small>
                    <strong>{day.dayNumber}</strong>
                    <span>{day.monthShort}</span>
                  </button>
                );
              })}
            </div>

            <div className="dashboard-schedule-dayline__lane-wrap">
              {selectedDayRecords.length > 0 ? (
                <div className="dashboard-schedule-dayline__lane">
                  {selectedDayRecords.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      className={
                        selectedSession?.id === record.id
                          ? "dashboard-schedule-dayline__event dashboard-schedule-dayline__event--active"
                          : "dashboard-schedule-dayline__event"
                      }
                      onClick={() => setSelectedSessionId(record.id)}
                    >
                      <div className="dashboard-schedule-dayline__event-head">
                        <label
                          className="dashboard-schedule-dayline__check"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSessionIds.includes(record.id)}
                            onChange={() => handleToggleSelection(record.id)}
                          />
                        </label>
                        <div className="dashboard-schedule-dayline__event-badges">
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

                      <div className="dashboard-schedule-dayline__event-meta">
                        <span>{record.timeRange}</span>
                        <span>{record.coachName}</span>
                        <span>{record.location}</span>
                      </div>

                      <small>{record.occupancyLabel}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  title="No sessions on this day"
                  description="Pick another date chip or adjust filters."
                />
              )}
            </div>
          </div>
        ) : (
          <DashboardEmptyState
            title="No sessions in this schedule view"
            description="Try another filter combination or create a session."
          />
        )}

        {false ? (
          <>
            <div className="dashboard-schedule-planner__actions">
              <p>
                {weekDays.length} days · {filteredRecords.length} occurrences
              </p>
              <button
                type="button"
                className="mv-btn mv-btn-outline"
                onClick={() => setCollapsedDays(isAllCollapsed ? [] : [...weekDays])}
              >
                {isAllCollapsed ? "Expand all days" : "Collapse all days"}
              </button>
            </div>

            <div className="dashboard-schedule-planner">
              {weekDays.map((day) => {
                const dayRecords = recordsByDay.get(day) ?? [];
                const isCollapsed = collapsedDays.includes(day);
                const firstRecord = dayRecords[0];

                return (
                  <section key={day} className="dashboard-schedule-planner__day">
                    <header className="dashboard-schedule-planner__day-header">
                      <div>
                        <strong>{day}</strong>
                        <span>{dayRecords.length} occurrences</span>
                      </div>
                      <button
                        type="button"
                        className="dashboard-schedule-planner__day-toggle"
                        onClick={() => handleToggleDay(day)}
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? `Expand ${day}` : `Collapse ${day}`}
                      >
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>
                    </header>

                    {isCollapsed ? (
                      <p className="dashboard-schedule-planner__collapsed-copy">
                        {firstRecord
                          ? `${firstRecord.timeRange} · ${firstRecord.title}`
                          : "No sessions"}
                      </p>
                    ) : (
                      <div className="dashboard-schedule-planner__day-body">
                        {dayRecords.map((record) => (
                          <button
                            key={record.id}
                            type="button"
                            className={
                              selectedSession?.id === record.id
                                ? "dashboard-schedule-planner__event dashboard-schedule-planner__event--active"
                                : "dashboard-schedule-planner__event"
                            }
                            onClick={() => setSelectedSessionId(record.id)}
                          >
                            <div className="dashboard-schedule-planner__event-head">
                              <label
                                className="dashboard-schedule-planner__check"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSessionIds.includes(record.id)}
                                  onChange={() => handleToggleSelection(record.id)}
                                />
                              </label>
                              <div className="dashboard-schedule-planner__event-badges">
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

                            <div className="dashboard-schedule-planner__event-meta">
                              <span>{record.timeRange}</span>
                              <span>{record.coachName}</span>
                              <span>{record.location}</span>
                            </div>

                            <small>{record.occupancyLabel}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header dashboard-panel__header--tight">
            <div>
              <div className="mv-eyebrow">Occurrence detail</div>
              <h2>{selectedSession?.title ?? "No session selected"}</h2>
              <p>{selectedSession?.focus ?? "Pick an occurrence from the day timeline."}</p>
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
              <strong>Action stopped</strong>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {selectedSession ? (
            <>
              <div className="dashboard-detail-grid">
                <div className="dashboard-detail-stat">
                  <span className="dashboard-detail-stat__label">Source</span>
                  <strong>Manual session</strong>
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
                </div>
              </div>

              <div className="dashboard-contact-block">
                <span className="dashboard-detail-stat__label">Admin note</span>
                <p>{selectedSession.attendanceNote}</p>
              </div>

            </>
          ) : (
            <DashboardEmptyState
              title="No occurrence available"
            description="Adjust the filters or create a session to populate the board."
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
              <strong>Bulk update stopped</strong>
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
              description="Use the checkboxes on the day timeline to build a bulk edit set."
            />
          )}
        </aside>
      </section>
    </div>
  );
}
