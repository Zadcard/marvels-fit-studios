"use client";

import {
  Fragment,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Dialog } from "radix-ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarPlus2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Dumbbell,
  FileText,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Repeat2,
  Search,
  ShieldUser,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  decideScheduleChangeRequest,
  logScheduleChangeRequest,
} from "@/app/actions/admin-schedule-change-requests";
import {
  cancelAdminSession,
  deleteAdminSession,
  saveAdminSession,
} from "@/app/actions/admin-sessions";
import {
  assignClientToSession,
  removeClientFromSession,
} from "@/app/actions/admin-session-bookings";
import {
  markAllAttendance,
  markAttendance,
} from "@/app/actions/admin-attendance";
import { formatPhoneNumber } from "@/lib/phone-format";
import { AdminRecurringSessionManager } from "@/components/dashboard/admin-recurring-session-manager";
import type {
  AdminScheduleChangeRequestRecord,
  AdminScheduleSessionRecord,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import type { RecurringSessionTemplateRecord } from "@/lib/dashboard/recurring-session-template";
import type {
  AdminScheduleClientOption,
  AdminScheduleGroupOption,
} from "@/lib/repositories/admin-schedule-repository";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";
import {
  addStudioDays,
  getStudioDateKey,
  instantToStudioDateTimeLocal,
  STUDIO_TIME_ZONE,
  studioDateKeyAnchor,
  studioDateTimeLocalToIso,
} from "@/lib/time/studio-time";
import styles from "./admin-schedule-workspace.module.css";

type Props = {
  stats: AdminScheduleStat[];
  records: AdminScheduleSessionRecord[];
  coachOptions: AdminSessionCoachOption[];
  groupOptions: AdminScheduleGroupOption[];
  clientOptions: AdminScheduleClientOption[];
  recurringTemplates: RecurringSessionTemplateRecord[];
  weekStartDate: string;
  defaultDurationMinutes: number;
  cancellationWindowMinutes: number;
  changeRequests: AdminScheduleChangeRequestRecord[];
};

type SessionForm = {
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  status: "DRAFT" | "SCHEDULED" | "COMPLETED";
  coachId: string;
  groupId: string;
  startsAt: string;
  endsAt: string;
};

type Confirmation =
  | { kind: "cancel"; sessionId: string; label: string; withinCancellationWindow: boolean }
  | { kind: "delete"; sessionId: string; label: string }
  | { kind: "remove-booking"; sessionId: string; clientId: string; label: string };

type LogRequestTarget = {
  clientId: string;
  clientName: string;
  sessionId: string;
  groupId: string | null;
};

type RequestForm = {
  kind: "CANCEL_OCCURRENCE" | "MOVE_OCCURRENCE" | "RECURRING_WEEKDAYS" | "PERMANENT_GROUP_CHANGE";
  reason: string;
  targetSessionId: string;
  fromWeekdays: number[];
  toWeekdays: number[];
  effectiveFrom: string;
  toGroupId: string;
};

const weekdayOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const coachColorPalette = ["#e62429", "#2f8f5b", "#3b6fe0", "#8b5cf6", "#d97706", "#0891b2"];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

const dayHeaderFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  month: "long",
  year: "numeric",
});
function toDateTimeLocal(value: string) {
  return instantToStudioDateTimeLocal(value);
}

function createEmptyForm(coachId = "", durationMinutes = 60): SessionForm {
  const starts = new Date();
  starts.setMinutes(0, 0, 0);
  starts.setHours(starts.getHours() + 1);
  const ends = new Date(starts.getTime() + durationMinutes * 60 * 1000);
  return {
    title: "",
    description: "",
    type: "GROUP",
    status: "SCHEDULED",
    coachId,
    groupId: "",
    startsAt: instantToStudioDateTimeLocal(starts),
    endsAt: instantToStudioDateTimeLocal(ends),
  };
}

function emptyRequestForm(): RequestForm {
  return {
    kind: "CANCEL_OCCURRENCE",
    reason: "",
    targetSessionId: "",
    fromWeekdays: [],
    toWeekdays: [],
    effectiveFrom: getStudioDateKey(),
    toGroupId: "",
  };
}

function statusClass(status: AdminScheduleSessionRecord["status"]) {
  if (status === "Live") return styles.statusLive;
  if (status === "Upcoming") return styles.upcoming;
  if (status === "Completed") return styles.completed;
  return styles.upcoming;
}

function getCairoMinutes(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function coachColor(coachId: string) {
  let hash = 0;
  for (let index = 0; index < coachId.length; index += 1) {
    hash = (hash * 31 + coachId.charCodeAt(index)) >>> 0;
  }
  return coachColorPalette[hash % coachColorPalette.length];
}

export function AdminScheduleWorkspace({
  stats,
  records,
  coachOptions,
  groupOptions,
  clientOptions,
  recurringTemplates,
  weekStartDate,
  defaultDurationMinutes,
  cancellationWindowMinutes,
  changeRequests,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [viewMode, setViewMode] = useState<"agenda" | "week" | "grid">("agenda");
  const todayKey = getStudioDateKey();
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addStudioDays(weekStartDate, index)),
    [weekStartDate],
  );
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() =>
    weekDays.includes(todayKey) ? todayKey : weekDays[0],
  );
  const [status, setStatus] = useState<AdminScheduleSessionRecord["status"] | "All">("All");
  const [type, setType] = useState<AdminScheduleSessionRecord["sessionType"] | "All">("All");
  const [coach, setCoach] = useState("all");
  const [group, setGroup] = useState("all");
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(() =>
    createEmptyForm(coachOptions[0]?.id, defaultDurationMinutes),
  );
  const [bookingClientId, setBookingClientId] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const [logRequestFor, setLogRequestFor] = useState<LogRequestTarget | null>(null);
  const [requestForm, setRequestForm] = useState<RequestForm>(emptyRequestForm);
  const [requestError, setRequestError] = useState("");
  const [requestNotice, setRequestNotice] = useState("");
  const [requestsCollapsed, setRequestsCollapsed] = useState(false);
  const [attendanceModalSessionId, setAttendanceModalSessionId] = useState<string | null>(null);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [attendanceFilterTab, setAttendanceFilterTab] = useState<
    "all" | "pending" | "attended" | "late" | "absent" | "excused"
  >("all");

  function handleMarkAttendance(
    sessionId: string,
    clientId: string,
    attendanceStatus: "BOOKED" | "ATTENDED" | "LATE" | "MISSED" | "EXCUSED" | "WAITLIST" | "CANCELED" | "NO_SHOW" | "RESCHEDULED",
  ) {
    setError("");
    startTransition(async () => {
      try {
        await markAttendance(sessionId, clientId, attendanceStatus);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update attendance.");
      }
    });
  }

  function handleMarkAllAttended(sessionId: string, clientIds: string[]) {
    if (!clientIds.length) return;
    setError("");
    startTransition(async () => {
      try {
        await markAllAttendance(sessionId, clientIds, "ATTENDED");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update attendance.");
      }
    });
  }

  function handleToggleLate(sessionId: string, clientId: string) {
    handleMarkAttendance(sessionId, clientId, "LATE");
  }

  function openCreateAtCell(dayKey: string, minutes: number) {
    setEditingId(null);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hoursStr = String(hours).padStart(2, "0");
    const minsStr = String(mins).padStart(2, "0");
    const startsAt = `${dayKey}T${hoursStr}:${minsStr}`;

    const endMinutes = minutes + defaultDurationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endHoursStr = String(endHours).padStart(2, "0");
    const endMinsStr = String(endMins).padStart(2, "0");
    const endsAt = `${dayKey}T${endHoursStr}:${endMinsStr}`;

    setForm({
      title: "",
      description: "",
      type: "GROUP",
      status: "SCHEDULED",
      coachId: coachOptions[0]?.id ?? "",
      groupId: "",
      startsAt,
      endsAt,
    });
    setError("");
    setEditorOpen(true);
  }

  function openCreateForDay(dayKey: string, hour = 9) {
    setEditingId(null);
    const hoursStr = String(hour).padStart(2, "0");
    const startsAt = `${dayKey}T${hoursStr}:00`;
    const endHour = hour + Math.ceil(defaultDurationMinutes / 60);
    const endHoursStr = String(endHour % 24).padStart(2, "0");
    const endsAt = `${dayKey}T${endHoursStr}:00`;

    setForm({
      title: "",
      description: "",
      type: "GROUP",
      status: "SCHEDULED",
      coachId: coachOptions[0]?.id ?? "",
      groupId: "",
      startsAt,
      endsAt,
    });
    setError("");
    setEditorOpen(true);
  }

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((record) =>
      (!query || [record.title, record.coachName, record.groupName].join(" ").toLowerCase().includes(query)) &&
      (status === "All" || record.status === status) &&
      (type === "All" || record.sessionType === type) &&
      (coach === "all" || record.coachId === coach) &&
      (group === "all" || (group === "none" ? !record.groupId : record.groupId === group)),
    );
  }, [coach, deferredSearch, group, records, status, type]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, AdminScheduleSessionRecord[]> = {};
    for (const dayKey of weekDays) {
      map[dayKey] = [];
    }
    for (const record of filtered) {
      if (map[record.dayKey]) {
        map[record.dayKey].push(record);
      }
    }
    for (const dayKey of Object.keys(map)) {
      map[dayKey].sort(
        (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      );
    }
    return map;
  }, [filtered, weekDays]);

  const selected = filtered.find((record) => record.id === selectedId) ?? null;
  const availableClients = selected
    ? clientOptions.filter((client) => !selected.bookedClients.some((booked) => booked.id === client.id))
    : [];
  const weekStart = studioDateKeyAnchor(weekStartDate);

function formatHourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

  const timeRows = useMemo(() => {
    const hours: number[] = [];
    for (let h = 8; h <= 23; h += 1) {
      hours.push(h);
    }
    hours.push(0); // 12:00 AM Midnight

    return hours.map((hour) => ({
      hour,
      minutes: hour * 60,
      label: formatHourLabel(hour),
    }));
  }, []);

  const moveTargetOptions = useMemo(() => {
    if (!logRequestFor?.groupId) return [];
    return records.filter(
      (record) =>
        record.groupId === logRequestFor.groupId &&
        record.id !== logRequestFor.sessionId &&
        (record.rawStatus === "DRAFT" || record.rawStatus === "SCHEDULED"),
    );
  }, [logRequestFor, records]);

  function navigateWeek(offset: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", addStudioDays(weekStartDate, offset * 7));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function navigateToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("week");
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  function openCreate() {
    setEditingId(null);
    setForm(createEmptyForm(coachOptions[0]?.id, defaultDurationMinutes));
    setError("");
    setEditorOpen(true);
  }

  function openDetails(record: AdminScheduleSessionRecord) {
    setSelectedId(record.id);
    setDetailsOpen(true);
  }

  function openEdit(record: AdminScheduleSessionRecord) {
    if (record.rawStatus === "CANCELED") return;
    setDetailsOpen(false);
    setEditingId(record.id);
    setForm({
      title: record.title,
      description: record.focus,
      type: record.sessionType === "Group" ? "GROUP" : "PRIVATE",
      status: record.rawStatus,
      coachId: record.coachId,
      groupId: record.groupId ?? "",
      startsAt: toDateTimeLocal(record.startsAt),
      endsAt: toDateTimeLocal(record.endsAt),
    });
    setError("");
    setEditorOpen(true);
  }

  function submitSession(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminSession({
          sessionId: editingId,
          title: form.title,
          description: form.description,
          type: form.type,
          status: form.status,
          coachId: form.coachId,
          groupId: form.groupId || null,
          startsAt: studioDateTimeLocalToIso(form.startsAt),
          endsAt: studioDateTimeLocalToIso(form.endsAt),
        });
        setEditorOpen(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the session.");
      }
    });
  }

  function addBooking() {
    if (!selected || !bookingClientId) return;
    setError("");
    startTransition(async () => {
      try {
        await assignClientToSession(selected.id, bookingClientId);
        setBookingClientId("");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not add the client.");
      }
    });
  }

  function confirmMutation() {
    if (!confirmation) return;
    setError("");
    startTransition(async () => {
      try {
        if (confirmation.kind === "remove-booking") {
          await removeClientFromSession(
            confirmation.sessionId,
            confirmation.clientId,
          );
        } else if (confirmation.kind === "cancel") {
          await cancelAdminSession(confirmation.sessionId);
        } else {
          await deleteAdminSession(confirmation.sessionId);
        }
        setConfirmation(null);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update the session.");
        setConfirmation(null);
      }
    });
  }

  function openLogRequest(client: { id: string; fullName: string }) {
    if (!selected) return;
    setLogRequestFor({
      clientId: client.id,
      clientName: client.fullName,
      sessionId: selected.id,
      groupId: selected.groupId,
    });
    setRequestForm(emptyRequestForm());
    setRequestError("");
  }

  function toggleWeekday(field: "fromWeekdays" | "toWeekdays", day: number) {
    setRequestForm((value) => ({
      ...value,
      [field]: value[field].includes(day)
        ? value[field].filter((entry) => entry !== day)
        : [...value[field], day].sort((left, right) => left - right),
    }));
  }

  function submitChangeRequest(event: FormEvent) {
    event.preventDefault();
    if (!logRequestFor) return;
    setRequestError("");
    startTransition(async () => {
      try {
        await logScheduleChangeRequest({
          clientId: logRequestFor.clientId,
          kind: requestForm.kind,
          reason: requestForm.reason,
          sourceSessionId:
            requestForm.kind === "CANCEL_OCCURRENCE" || requestForm.kind === "MOVE_OCCURRENCE"
              ? logRequestFor.sessionId
              : undefined,
          targetSessionId: requestForm.kind === "MOVE_OCCURRENCE" ? requestForm.targetSessionId : undefined,
          groupId:
            requestForm.kind === "RECURRING_WEEKDAYS" || requestForm.kind === "PERMANENT_GROUP_CHANGE"
              ? (logRequestFor.groupId ?? undefined)
              : undefined,
          toGroupId: requestForm.kind === "PERMANENT_GROUP_CHANGE" ? requestForm.toGroupId : undefined,
          fromWeekdays: requestForm.kind === "RECURRING_WEEKDAYS" ? requestForm.fromWeekdays : undefined,
          toWeekdays: requestForm.kind === "RECURRING_WEEKDAYS" ? requestForm.toWeekdays : undefined,
          effectiveFrom:
            requestForm.kind === "RECURRING_WEEKDAYS" || requestForm.kind === "PERMANENT_GROUP_CHANGE"
              ? requestForm.effectiveFrom
              : undefined,
        });
        setLogRequestFor(null);
        router.refresh();
      } catch (caught) {
        setRequestError(caught instanceof Error ? caught.message : "Could not log the change request.");
      }
    });
  }

  function decideRequest(requestId: string, decision: "APPROVED" | "DECLINED") {
    setRequestNotice("");
    startTransition(async () => {
      try {
        const result = await decideScheduleChangeRequest(requestId, decision);
        if (result.resultSummary) {
          setRequestNotice(result.resultSummary);
        }
        router.refresh();
      } catch (caught) {
        setRequestNotice(caught instanceof Error ? caught.message : "Could not process the request.");
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      <header className={styles.header}>
        <div><span className={styles.kicker}>Studio calendar</span><h1>Program the week.</h1><p>Create occurrences, link groups, manage rosters, and review coach coverage.</p></div>
      </header>

      <section className={styles.stats} aria-label="Schedule summary">
        {stats.map((stat) => <article key={stat.id}><span>{stat.label}</span><strong>{stat.value}</strong><p>{stat.change}</p></article>)}
      </section>

      <section className={styles.reviewLayout} data-requests-collapsed={requestsCollapsed || changeRequests.length === 0 || undefined}>
        <div className={styles.scheduler}>
          <div className={styles.schedulerTop}>
            <div className={styles.monthNav}><button type="button" aria-label="Previous week" onClick={() => navigateWeek(-1)} disabled={isPending}><ChevronLeft size={18} /></button><div><button type="button" className={styles.todayButton} onClick={navigateToday} disabled={isPending}>Today</button><strong>{monthFormatter.format(weekStart)}</strong></div><button type="button" aria-label="Next week" onClick={() => navigateWeek(1)} disabled={isPending}><ChevronRight size={18} /></button></div>

            <div className={styles.viewToggleStrip}>
              <button
                type="button"
                className={styles.viewToggleButton}
                data-active={viewMode === "agenda" || undefined}
                onClick={() => setViewMode("agenda")}
                title="Agenda timeline view"
              >
                Agenda
              </button>
              <button
                type="button"
                className={styles.viewToggleButton}
                data-active={viewMode === "week" || undefined}
                onClick={() => setViewMode("week")}
                title="Week columns view"
              >
                Week Cards
              </button>
              <button
                type="button"
                className={styles.viewToggleButton}
                data-active={viewMode === "grid" || undefined}
                onClick={() => setViewMode("grid")}
                title="Hourly matrix grid"
              >
                Hourly Grid
              </button>
            </div>

            <div className={styles.search}><Search size={17} /><label className="sr-only" htmlFor="schedule-search">Search schedule</label><input id="schedule-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Session, coach or group" /></div>
            <div className={styles.schedulerActions}><AdminRecurringSessionManager templates={recurringTemplates} coachOptions={coachOptions} groupOptions={groupOptions} defaultDurationMinutes={defaultDurationMinutes} /><button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><CalendarPlus2 size={17} /> New session</button></div>
          </div>
          <div className={styles.filterStrip}>
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>All</option><option>Upcoming</option><option>Live</option><option>Completed</option></select></label>
            <label>Type<select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option>All</option><option>Group</option><option>Private</option></select></label>
            <label>Coach<select value={coach} onChange={(event) => setCoach(event.target.value)}><option value="all">All coaches</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label>
            <label>Group<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All groups</option><option value="none">No group</option>{groupOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            <span>{filtered.length} visible sessions</span>
          </div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          {/* Render Active View Mode */}
          {viewMode === "agenda" ? (
            <>
              {/* 7-Day Date Ribbon */}
              <div className={styles.dateRibbon}>
                {weekDays.map((dayKey) => {
                  const day = studioDateKeyAnchor(dayKey);
                  const count = sessionsByDay[dayKey]?.length ?? 0;
                  const isSelected = selectedDayKey === dayKey;
                  const isToday = dayKey === todayKey;
                  const dayName = dayHeaderFormatter.format(day).split(",")[0];
                  const dayNum = day.getUTCDate();
                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={styles.dateChip}
                      data-active={isSelected || undefined}
                      data-today={isToday || undefined}
                      onClick={() => setSelectedDayKey(dayKey)}
                    >
                      {isToday && <span className={styles.todayDot} title="Today" />}
                      <span className={styles.dateChipName}>{dayName}</span>
                      <span className={styles.dateChipNum}>{dayNum}</span>
                      <span className={styles.dateChipBadge}>
                        {count} {count === 1 ? "session" : "sessions"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Agenda Chronological List */}
              {(() => {
                const activeDayDate = studioDateKeyAnchor(selectedDayKey);
                const activeSessions = sessionsByDay[selectedDayKey] ?? [];
                return (
                  <div className={styles.agendaContainer}>
                    <div className={styles.agendaHeader}>
                      <div className={styles.agendaTitleGroup}>
                        <h2>{dayHeaderFormatter.format(activeDayDate)}</h2>
                        <p>
                          {activeSessions.length}{" "}
                          {activeSessions.length === 1 ? "scheduled session" : "scheduled sessions"} ordered chronologically
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mv-btn mv-btn-primary"
                        onClick={() => openCreateForDay(selectedDayKey)}
                      >
                        <Plus size={15} /> Add Session on {dayHeaderFormatter.format(activeDayDate).split(",")[0]}
                      </button>
                    </div>

                    {activeSessions.length === 0 ? (
                      <div className={styles.emptyAgenda}>
                        <CalendarClock size={32} style={{ opacity: 0.5, color: "var(--rl-muted)" }} />
                        <h3>No Sessions Scheduled</h3>
                        <p>There are no sessions scheduled for this day yet. Click below to add a session.</p>
                        <button
                          type="button"
                          className="mv-btn mv-btn-primary"
                          onClick={() => openCreateForDay(selectedDayKey)}
                        >
                          <Plus size={15} /> Schedule Session for {dayHeaderFormatter.format(activeDayDate).split(",")[0]}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.agendaTimeline}>
                        {activeSessions.map((record) => (
                          <article
                            key={record.id}
                            className={styles.agendaCard}
                            style={{ borderLeftColor: coachColor(record.coachId) }}
                          >
                            <div className={styles.agendaTimeCol}>
                              <span className={styles.agendaTimeRange}>{record.timeRange}</span>
                            </div>
                            <div className={styles.agendaMainCol}>
                              <span className={styles.agendaSessionTitle}>{record.title}</span>
                              <div className={styles.agendaMetaRow}>
                                <span className={styles.coachTag}>
                                  <ShieldUser size={12} /> {record.coachName}
                                </span>
                                {record.groupName && record.groupName !== "No linked group" && (
                                  <span className={styles.groupTag}>{record.groupName}</span>
                                )}
                                <span className={styles.capacityPill}>
                                  <Users size={12} /> {record.bookedCount} booked
                                </span>
                              </div>
                            </div>
                            <span className={statusClass(record.status)}>
                              {record.rawStatus === "CANCELED" ? "Canceled" : record.status === "Live" ? "🔴 Live now" : record.status === "Upcoming" ? "Upcoming" : record.status === "Completed" ? "Ended" : record.status}
                            </span>
                            <div className={styles.agendaActions}>
                              <button
                                type="button"
                                onClick={() => setAttendanceModalSessionId(record.id)}
                                title="Take or view attendance for this session"
                                style={{ color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.3)" }}
                              >
                                <CalendarCheck size={14} />
                                Attendance ({record.bookedClients.filter((c) => c.status === "ATTENDED").length}/{record.bookedClients.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => openDetails(record)}
                                title="View roster & session details"
                              >
                                Details
                              </button>
                              {record.rawStatus !== "CANCELED" && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(record)}
                                  title="Edit session details"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : viewMode === "week" ? (
            /* Week Columns View */
            <div className={styles.weekColumnsGrid}>
              {weekDays.map((dayKey) => {
                const day = studioDateKeyAnchor(dayKey);
                const daySessions = sessionsByDay[dayKey] ?? [];
                const isToday = dayKey === todayKey;
                return (
                  <div key={dayKey} className={styles.weekColumnCard} data-today={isToday || undefined}>
                    <div className={styles.weekColumnHeader}>
                      <div className={styles.weekColumnTitle}>
                        <span className={styles.weekColumnDayName}>{dayHeaderFormatter.format(day).split(",")[0]}</span>
                        <span className={styles.weekColumnDateNum}>{day.getUTCDate()}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.weekColumnAddButton}
                        title={`Add session on ${dayKey}`}
                        onClick={() => openCreateForDay(dayKey)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className={styles.weekColumnStack}>
                      {daySessions.length === 0 ? (
                        <span className={styles.noSessionsText}>No sessions</span>
                      ) : (
                        daySessions.map((record) => (
                          <div
                            key={record.id}
                            className={styles.weekSessionBlock}
                            style={{ borderLeftColor: coachColor(record.coachId) }}
                            onClick={() => openDetails(record)}
                          >
                            <span className={styles.weekSessionTime}>{record.timeRange}</span>
                            <span className={styles.weekSessionTitle}>{record.title}</span>
                            <span className={styles.weekSessionCoach}>{record.coachName}</span>
                            {record.groupName && record.groupName !== "No linked group" && (
                              <span className={styles.weekSessionGroupTag}>{record.groupName}</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Hourly Matrix Grid View */
            <div className={styles.weekScroll}>
              {timeRows.length === 0 ? (
                <p className={styles.gridEmpty}>No sessions match these filters.</p>
              ) : (
                <div className={styles.grid}>
                  <div className={styles.gridCorner}><Clock3 size={13} /></div>
                  {weekDays.map((dayKey) => {
                    const day = studioDateKeyAnchor(dayKey);
                    return <div className={styles.gridDayHeader} key={dayKey} data-today={dayKey === getStudioDateKey() || undefined}><span>{dayHeaderFormatter.format(day).split(",")[0]}</span><strong>{day.getUTCDate()}</strong></div>;
                  })}
                  {timeRows.map(({ hour, minutes, label }) => (
                    <Fragment key={hour}>
                      <div className={styles.gridTimeLabel}>{label}</div>
                      {weekDays.map((dayKey) => {
                        const cellRecords = filtered.filter(
                          (record) =>
                            record.dayKey === dayKey &&
                            Math.floor(getCairoMinutes(record.startsAt) / 60) === hour,
                        );
                        return (
                          <div className={styles.gridCell} key={`${dayKey}-${hour}`} data-today={dayKey === getStudioDateKey() || undefined}>
                            {cellRecords.length === 0 ? (
                              <button
                                type="button"
                                className={styles.emptySlotButton}
                                onClick={() => openCreateAtCell(dayKey, minutes)}
                                aria-label={`Add session on ${dayKey} at ${label}`}
                              >
                                <Plus size={13} /> Add
                              </button>
                            ) : (
                              <div className={styles.gridCellBlockGroup}>
                                {cellRecords.length > 1 && (
                                  <div className={styles.multiSessionBadge}>
                                    <Repeat2 size={10} /> {cellRecords.length} Sessions at {label}
                                  </div>
                                )}
                                {cellRecords.map((record) => (
                                  <button
                                    type="button"
                                    key={record.id}
                                    className={styles.gridBlock}
                                    style={{ borderLeftColor: coachColor(record.coachId) }}
                                    data-canceled={record.rawStatus === "CANCELED" || undefined}
                                    data-draft={record.rawStatus === "DRAFT" || undefined}
                                    data-completed={record.rawStatus === "COMPLETED" || undefined}
                                    onClick={() => openDetails(record)}
                                  >
                                    <span className={styles.gridBlockTime}>{record.timeRange}</span>
                                    <span className={styles.gridBlockTitle}>{record.title}</span>
                                    {record.groupName && record.groupName !== "No linked group" && (
                                      <span className={styles.gridBlockGroupTag}>{record.groupName}</span>
                                    )}
                                    <span className={styles.gridBlockCoach}>{record.coachName}</span>
                                    <span className={styles.gridBlockCapacity}>
                                      <Users size={10} /> {record.bookedCount} booked
                                    </span>
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className={styles.addMoreSlotButton}
                                  onClick={() => openCreateAtCell(dayKey, minutes)}
                                  aria-label={`Add another session on ${dayKey} at ${label}`}
                                  title="Add another session to this time slot"
                                >
                                  <Plus size={11} /> Add session
                                </button>
                              </div>
                            )}
                          </div>
                        );

                      })}
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className={styles.requestsCard}>
          <div className={styles.sectionHeading}>
            <div><span>Change requests</span><h2>Waiting</h2></div>
            <div className={styles.requestHeadingRight}>
              <small>{changeRequests.length} waiting</small>
              <button
                type="button"
                className={styles.toggleRequestsButton}
                onClick={() => setRequestsCollapsed(!requestsCollapsed)}
                aria-label={requestsCollapsed ? "Expand requests panel" : "Collapse requests panel"}
                title={requestsCollapsed ? "Expand requests panel" : "Collapse requests panel"}
              >
                {requestsCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
              </button>
            </div>
          </div>
          {!requestsCollapsed && (
            <>
              {requestNotice ? <p className={styles.summaryNotice} role="status">{requestNotice}</p> : null}
              {changeRequests.length === 0 ? (
                <p className={styles.noRequests}>No pending requests.</p>
              ) : (
                <div className={styles.requestList}>
                  {changeRequests.map((request) => (
                    <div className={styles.requestItem} key={request.id}>
                      <div className={styles.requestItemHead}>
                        <div><strong>{request.clientName}</strong><small>{request.reason}</small></div>
                        <span
                          className={styles.requestBadge}
                          data-recurring={
                            request.kind === "RECURRING_WEEKDAYS" || request.kind === "PERMANENT_GROUP_CHANGE"
                              ? true
                              : undefined
                          }
                        >
                          {request.kindLabel}
                        </span>
                      </div>
                      <p className={styles.requestDescription}>{request.description}</p>
                      <div className={styles.requestActions}>
                        <button type="button" className={styles.approveButton} disabled={isPending} onClick={() => decideRequest(request.id, "APPROVED")}><Check size={14} /> Approve</button>
                        <button type="button" className={styles.declineButton} disabled={isPending} onClick={() => decideRequest(request.id, "DECLINED")}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </section>

      <Dialog.Root open={detailsOpen && !!selected} onOpenChange={setDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.inspectorModal}>
            {selected ? (
              <>
                <div className={styles.inspectorHeader}>
                  <div>
                    <div className={styles.inspectorBadges}>
                      <span className={styles.typeBadge}>{selected.sessionType}</span>
                      <span className={statusClass(selected.status)}>
                        {selected.rawStatus === "CANCELED" ? "Canceled" : selected.status}
                      </span>
                    </div>
                    <Dialog.Title className={styles.inspectorTitle}>{selected.title}</Dialog.Title>
                    <Dialog.Description className={styles.inspectorSubtitle}>
                      {selected.dayLabel}, {selected.dateLabel} · {selected.timeRange}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className={styles.close} aria-label="Close session details">
                    <X size={18} />
                  </Dialog.Close>
                </div>

                <div className={styles.inspectorGrid}>
                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}>
                      <Clock3 size={14} />
                      <span>Time & Date</span>
                    </div>
                    <strong>{selected.dayLabel}, {selected.dateLabel}</strong>
                    <small>{selected.timeRange}</small>
                  </div>

                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}>
                      <ShieldUser size={14} />
                      <span>Coach</span>
                    </div>
                    <strong>{selected.coachName}</strong>
                    <small>Session Lead</small>
                  </div>

                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}>
                      <Users size={14} />
                      <span>Bookings</span>
                    </div>
                    <strong>{selected.bookedCount} Booked</strong>
                    <small>{selected.waitlistCount} Waitlisted</small>
                  </div>

                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}>
                      <Dumbbell size={14} />
                      <span>Group</span>
                    </div>
                    <strong>{selected.groupName}</strong>
                    <small>Category</small>
                  </div>
                </div>

                <div className={styles.inspectorSectionCard}>
                  <h3>Client Roster ({selected.bookedClients.length})</h3>
                  {selected.bookedClients.length ? (
                    <ul className={styles.rosterList}>
                      {selected.bookedClients.map((client) => (
                        <li key={client.id} className={styles.rosterListItem}>
                          <div className={styles.rosterClientInfo}>
                            <span className={styles.clientName}>{client.fullName}</span>
                            {client.status !== "BOOKED" ? (
                              <span className={styles.clientStatusBadge} data-status={client.status}>
                                {client.status === "ATTENDED"
                                  ? "Attended"
                                  : client.status === "MISSED"
                                    ? "Absent"
                                    : client.status === "WAITLIST"
                                      ? "Waitlist"
                                      : client.status}
                              </span>
                            ) : null}
                          </div>
                          {selected.rawStatus === "SCHEDULED" || selected.rawStatus === "DRAFT" ? (
                            <div className={styles.clientActions}>
                              <button type="button" onClick={() => openLogRequest(client)}>
                                <CalendarClock size={13} /> Request
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirmation({ kind: "remove-booking", sessionId: selected.id, clientId: client.id, label: client.fullName })}
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyRosterText}>No clients booked for this session.</p>
                  )}

                  {selected.rawStatus === "SCHEDULED" || selected.rawStatus === "DRAFT" ? (
                    <div className={styles.addClientRow}>
                      <select
                        aria-label="Client to add"
                        value={bookingClientId}
                        onChange={(event) => setBookingClientId(event.target.value)}
                      >
                        <option value="">Select client to add...</option>
                        {availableClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.fullName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!bookingClientId || isPending}
                        onClick={addBooking}
                        className="mv-btn mv-btn-primary"
                      >
                        <UserPlus size={14} /> Add
                      </button>
                    </div>
                  ) : null}
                </div>

                {selected.focus ? (
                  <div className={styles.inspectorSectionCard}>
                    <h3>Training Focus</h3>
                    <p className={styles.emptyRosterText}>{selected.focus}</p>
                  </div>
                ) : null}

                {selected.sourceTemplateId ? (
                  <div className={styles.inspectorSectionCard}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Repeat2 size={14} />{" "}
                      {selected.isTemplateException ? "Recurring exception" : "Recurring occurrence"}
                    </h3>
                    <p className={styles.emptyRosterText}>
                      {selected.isTemplateException
                        ? "This occurrence has an intentional day or time override."
                        : "Editing or cancelling here changes this occurrence only."}
                    </p>
                  </div>
                ) : null}

                <div className={styles.inspectorFooter}>
                  <button
                    type="button"
                    className="mv-btn mv-btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setAttendanceModalSessionId(selected.id)}
                  >
                    <CalendarCheck size={16} /> Attendance →
                  </button>
                  {selected.rawStatus !== "CANCELED" ? (
                    <button type="button" className="mv-btn mv-btn-primary" onClick={() => openEdit(selected)}>
                      Edit session
                    </button>
                  ) : null}
                  {selected.rawStatus === "DRAFT" || selected.rawStatus === "SCHEDULED" ? (
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setConfirmation({ kind: "cancel", sessionId: selected.id, label: selected.title, withinCancellationWindow: cancellationWindowMinutes > 0 && Date.parse(selected.startsAt) - Date.now() < cancellationWindowMinutes * 60_000 })}
                      disabled={isPending}
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  ) : null}
                  {selected.rawStatus === "DRAFT" && selected.bookedClients.length === 0 ? (
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setConfirmation({ kind: "delete", sessionId: selected.id, label: selected.title })}
                      disabled={isPending}
                    >
                      <Trash2 size={16} /> Delete draft
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{editingId ? "Edit session" : "Create a session"}</Dialog.Title><Dialog.Description>Define the occurrence, linked group, coach, and timing.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close session editor"><X size={18} /></Dialog.Close><form onSubmit={submitSession} className={styles.form}>
        <label className={styles.full}>Session title<input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></label>
        <label className={styles.full}>Training focus<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
        <label>Type<select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as SessionForm["type"] }))}><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label>
        <label>Status<select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as SessionForm["status"] }))}><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option></select></label>
        <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm((value) => ({ ...value, startsAt: event.target.value }))} /></label>
        <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={(event) => setForm((value) => ({ ...value, endsAt: event.target.value }))} /></label>
        <label>Coach<select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}><option value="">Select coach</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label>
        <label>Group<select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}><option value="">No linked group</option>{groupOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {error ? <p className={`${styles.error} ${styles.full}`} role="alert">{error}</p> : null}
        <div className={`${styles.formActions} ${styles.full}`}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Close</button><button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Save session"}</button></div>
      </form></Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{confirmation?.kind === "remove-booking" ? "Remove this booking?" : confirmation?.kind === "delete" ? "Delete this draft?" : "Cancel this session?"}</Dialog.Title><Dialog.Description>{confirmation?.kind === "cancel" ? "Active bookings will be canceled with the session." : confirmation?.kind === "delete" ? "Only an empty draft can be permanently deleted." : `${confirmation?.label ?? "This client"} will be removed from the session roster.`}</Dialog.Description>{confirmation?.kind === "cancel" && confirmation.withinCancellationWindow ? <p className={styles.error}>This session starts within the studio&apos;s {cancellationWindowMinutes >= 60 ? `${cancellationWindowMinutes / 60}-hour` : `${cancellationWindowMinutes}-minute`} cancellation window. Clients may not have been notified in time.</p> : null}<div className={styles.formActions}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setConfirmation(null)}>Keep it</button><button type="button" className={styles.cancelButton} onClick={confirmMutation} disabled={isPending}>Confirm</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={!!logRequestFor} onOpenChange={(open) => !open && setLogRequestFor(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>Log a change request</Dialog.Title><Dialog.Description>{logRequestFor ? `On behalf of ${logRequestFor.clientName}.` : ""}</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close change request form"><X size={18} /></Dialog.Close><form onSubmit={submitChangeRequest} className={styles.form}>
        <label className={styles.full}>What changed?<select value={requestForm.kind} onChange={(event) => setRequestForm((value) => ({ ...value, kind: event.target.value as RequestForm["kind"] }))}>
          <option value="CANCEL_OCCURRENCE">Cancel this booking</option>
          <option value="MOVE_OCCURRENCE">Move to a different session</option>
          {logRequestFor?.groupId ? <option value="RECURRING_WEEKDAYS">Change weekly days</option> : null}
          {logRequestFor?.groupId ? <option value="PERMANENT_GROUP_CHANGE">Permanently change group</option> : null}
        </select></label>
        <label className={styles.full}>Reason<input required value={requestForm.reason} onChange={(event) => setRequestForm((value) => ({ ...value, reason: event.target.value }))} placeholder="e.g. Work travel" /></label>
        {requestForm.kind === "MOVE_OCCURRENCE" ? (
          <label className={styles.full}>Move to<select required value={requestForm.targetSessionId} onChange={(event) => setRequestForm((value) => ({ ...value, targetSessionId: event.target.value }))}>
            <option value="">Select a session</option>
            {moveTargetOptions.map((option) => <option value={option.id} key={option.id}>{option.title} · {option.dayLabel}, {option.timeRange}</option>)}
          </select></label>
        ) : null}
        {requestForm.kind === "RECURRING_WEEKDAYS" ? (
          <>
            <label className={styles.full}>From weekdays<div className={styles.weekdayPicker}>{weekdayOptions.map((option) => <label key={option.value}><input type="checkbox" checked={requestForm.fromWeekdays.includes(option.value)} onChange={() => toggleWeekday("fromWeekdays", option.value)} /><span>{option.label}</span></label>)}</div></label>
            <label className={styles.full}>To weekdays<div className={styles.weekdayPicker}>{weekdayOptions.map((option) => <label key={option.value}><input type="checkbox" checked={requestForm.toWeekdays.includes(option.value)} onChange={() => toggleWeekday("toWeekdays", option.value)} /><span>{option.label}</span></label>)}</div></label>
            <label className={styles.full}>Effective from<input type="date" required value={requestForm.effectiveFrom} onChange={(event) => setRequestForm((value) => ({ ...value, effectiveFrom: event.target.value }))} /></label>
          </>
        ) : null}
        {requestForm.kind === "PERMANENT_GROUP_CHANGE" ? (
          <>
            <label className={styles.full}>Move to group<select required value={requestForm.toGroupId} onChange={(event) => setRequestForm((value) => ({ ...value, toGroupId: event.target.value }))}>
              <option value="">Select a group</option>
              {groupOptions.filter((option) => option.id !== logRequestFor?.groupId).map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}
            </select></label>
            <label className={styles.full}>Effective from<input type="date" required value={requestForm.effectiveFrom} onChange={(event) => setRequestForm((value) => ({ ...value, effectiveFrom: event.target.value }))} /></label>
          </>
        ) : null}
        {requestError ? <p className={`${styles.error} ${styles.full}`} role="alert">{requestError}</p> : null}
        <div className={`${styles.formActions} ${styles.full}`}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setLogRequestFor(null)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Logging…" : "Log request"}</button></div>
      </form></Dialog.Content></Dialog.Portal></Dialog.Root>

      {/* Attendance Roster Table Modal */}
      {(() => {
        const attendanceSession = records.find((r) => r.id === attendanceModalSessionId);
        if (!attendanceSession) return null;

        const allClients = attendanceSession.bookedClients;
        const totalCount = allClients.length;
        const attendedCount = allClients.filter((c) => c.status === "ATTENDED").length;
        const pendingCount = allClients.filter((c) => c.status === "BOOKED" || c.status === "WAITLIST").length;
        const lateCount = allClients.filter((c) => c.status === "LATE").length;
        const absentCount = allClients.filter((c) => c.status === "MISSED" || c.status === "NO_SHOW").length;
        const excusedCount = allClients.filter((c) => c.status === "EXCUSED").length;

        const pendingClientIds = allClients
          .filter((c) => c.status === "BOOKED" || c.status === "WAITLIST")
          .map((c) => c.id);

        const filteredRoster = allClients.filter((client) => {
          const query = attendanceSearchQuery.trim().toLowerCase();
          const matchesQuery =
            !query ||
            client.fullName.toLowerCase().includes(query) ||
            (client.phone && client.phone.includes(query));

          if (!matchesQuery) return false;

          if (attendanceFilterTab === "pending") return client.status === "BOOKED" || client.status === "WAITLIST";
          if (attendanceFilterTab === "attended") return client.status === "ATTENDED";
          if (attendanceFilterTab === "late") return client.status === "LATE";
          if (attendanceFilterTab === "absent") return client.status === "MISSED" || client.status === "NO_SHOW";
          if (attendanceFilterTab === "excused") return client.status === "EXCUSED";
          return true;
        });

        return (
          <Dialog.Root open={!!attendanceModalSessionId} onOpenChange={(open) => !open && setAttendanceModalSessionId(null)}>
            <Dialog.Portal>
              <Dialog.Overlay className={styles.overlay} />
              <Dialog.Content className={styles.attendanceModal}>
                <div className={styles.attendanceHeader}>
                  <div>
                    <Dialog.Title className={styles.attendanceTitle}>
                      Session Attendance Roster
                    </Dialog.Title>
                    <Dialog.Description className={styles.attendanceSub}>
                      {attendanceSession.title} · {attendanceSession.coachName} · {attendanceSession.dayLabel}, {attendanceSession.dateLabel} ({attendanceSession.timeRange})
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className={styles.close} aria-label="Close attendance dialog">
                    <X size={18} />
                  </Dialog.Close>
                </div>

                <div className={styles.attendanceToolbar}>
                  <div className={styles.attendanceSearchBox}>
                    <Search size={15} style={{ color: "var(--rl-muted)" }} />
                    <input
                      type="text"
                      placeholder="Search client by name or phone..."
                      value={attendanceSearchQuery}
                      onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                    />
                    {attendanceSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setAttendanceSearchQuery("")}
                        style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--rl-muted)" }}
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>

                  <div className={styles.attendanceFilterPills}>
                    <button
                      type="button"
                      data-active={attendanceFilterTab === "all" || undefined}
                      onClick={() => setAttendanceFilterTab("all")}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      type="button"
                      data-active={attendanceFilterTab === "pending" || undefined}
                      onClick={() => setAttendanceFilterTab("pending")}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      type="button"
                      data-active={attendanceFilterTab === "attended" || undefined}
                      onClick={() => setAttendanceFilterTab("attended")}
                    >
                      Attended ({attendedCount})
                    </button>
                    <button
                      type="button"
                      data-active={attendanceFilterTab === "late" || undefined}
                      onClick={() => setAttendanceFilterTab("late")}
                    >
                      Late ({lateCount})
                    </button>
                    <button
                      type="button"
                      data-active={attendanceFilterTab === "absent" || undefined}
                      onClick={() => setAttendanceFilterTab("absent")}
                    >
                      Absent ({absentCount})
                    </button>
                    <button
                      type="button"
                      data-active={attendanceFilterTab === "excused" || undefined}
                      onClick={() => setAttendanceFilterTab("excused")}
                    >
                      Excused ({excusedCount})
                    </button>
                  </div>
                </div>

                <div className={styles.attendanceBulkBar}>
                  <div>
                    <strong>Attendance Progress ({attendedCount} / {totalCount} Attended)</strong>
                  </div>
                  {pendingClientIds.length > 0 && (
                    <button
                      type="button"
                      className={styles.markAllButton}
                      disabled={isPending}
                      onClick={() => handleMarkAllAttended(attendanceSession.id, pendingClientIds)}
                    >
                      <Check size={14} /> Mark All Attended ({pendingClientIds.length})
                    </button>
                  )}
                </div>

                {filteredRoster.length === 0 ? (
                  <p className={styles.emptyRosterText}>No clients match the current filter.</p>
                ) : (
                  <div className={styles.rosterTable}>
                    <div className={styles.rosterHead}>
                      <span>State</span>
                      <span>Client</span>
                      <span>Contact</span>
                      <span>Actions</span>
                    </div>
                    {filteredRoster.map((client) => {
                      const isAttended = client.status === "ATTENDED";
                      const isMissed = client.status === "MISSED" || client.status === "NO_SHOW";
                      const isLate = client.status === "LATE";
                      const isExcused = client.status === "EXCUSED";
                      const formattedPhone = formatPhoneNumber(client.phone);

                      return (
                        <div key={client.id} className={styles.rosterRowTable}>
                          <div className={styles.stateCell}>
                            <span
                              className={styles.stateGlyph}
                              data-status={client.status}
                              title={client.status}
                            >
                              {isExcused ? <FileText size={15} /> : isLate ? <Clock size={15} /> : isAttended ? <Check size={15} /> : isMissed ? <X size={15} /> : "—"}
                            </span>
                          </div>

                          <div className={styles.clientCol}>
                            <div className={styles.avatarCircle}>{initials(client.fullName)}</div>
                            <div className={styles.clientTextCol}>
                              <div className={styles.clientNameLine}>
                                <strong className={styles.clientName}>{client.fullName}</strong>
                                {client.isTrial ? (
                                  <span className={styles.badgeTrial}>Lead</span>
                                ) : (
                                  <span className={styles.badgeMember}>Member</span>
                                )}
                                {client.hasInjuryAlert && (
                                  <span className={styles.badgeInjury} title={client.injuryStatus ?? "Active Injury Alert"}>
                                    <AlertTriangle size={10} /> Injury Alert
                                  </span>
                                )}
                              </div>
                              {client.hasInjuryAlert && client.injuryStatus && (
                                <span className={styles.injuryBannerText}>
                                  <AlertTriangle size={11} /> Injury: {client.injuryStatus}
                                </span>
                              )}
                              {isExcused && (
                                <span className={styles.excusedBannerText}>
                                  <FileText size={11} /> Excused
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={styles.phoneCol}>
                            <span className={styles.phoneText}>{formattedPhone}</span>
                            {client.phone && !client.phone.includes("No phone") && (
                              <a
                                href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.waBtn}
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            )}
                          </div>

                          <div className={styles.attendanceActionsGroup}>
                            <button
                              type="button"
                              className={styles.checkinBtn}
                              data-active={isAttended || undefined}
                              data-tone="attended"
                              disabled={isPending}
                              onClick={() => handleMarkAttendance(attendanceSession.id, client.id, "ATTENDED")}
                              title="Mark Attended"
                            >
                              <Check size={13} /> Attended
                            </button>
                            <button
                              type="button"
                              className={styles.checkinBtn}
                              data-active={isLate || undefined}
                              data-tone="late"
                              disabled={isPending}
                              onClick={() => handleToggleLate(attendanceSession.id, client.id)}
                              title="Mark Attended (Late)"
                            >
                              <Clock size={13} /> Late
                            </button>
                            <button
                              type="button"
                              className={styles.checkinBtn}
                              data-active={isMissed || undefined}
                              data-tone="missed"
                              disabled={isPending}
                              onClick={() => handleMarkAttendance(attendanceSession.id, client.id, "MISSED")}
                              title="Mark Absent / Missed"
                            >
                              <X size={13} /> Absent
                            </button>
                            <button
                              type="button"
                              className={styles.checkinBtn}
                              data-active={isExcused || undefined}
                              data-tone="excused"
                              disabled={isPending}
                              onClick={() => handleMarkAttendance(attendanceSession.id, client.id, "EXCUSED")}
                              title="Mark Excused"
                            >
                              <FileText size={13} /> Excused
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        );
      })()}

    </div>
  );
}
