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
  CalendarClock,
  CalendarPlus2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  MapPin,
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
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
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
  kind: "CANCEL_OCCURRENCE" | "MOVE_OCCURRENCE" | "RECURRING_WEEKDAYS";
  reason: string;
  targetSessionId: string;
  fromWeekdays: number[];
  toWeekdays: number[];
  effectiveFrom: string;
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
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
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
    location: "",
    startsAt: instantToStudioDateTimeLocal(starts),
    endsAt: instantToStudioDateTimeLocal(ends),
    capacity: "12",
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
  };
}

function statusClass(status: AdminScheduleSessionRecord["status"]) {
  if (status === "Confirmed") return styles.confirmed;
  if (status === "Waitlist") return styles.waitlist;
  if (status === "Completed") return styles.completed;
  return styles.attention;
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

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((record) =>
      (!query || [record.title, record.coachName, record.groupName, record.location].join(" ").toLowerCase().includes(query)) &&
      (status === "All" || record.status === status) &&
      (type === "All" || record.sessionType === type) &&
      (coach === "all" || record.coachId === coach) &&
      (group === "all" || (group === "none" ? !record.groupId : record.groupId === group)),
    );
  }, [coach, deferredSearch, group, records, status, type]);
  const selected = filtered.find((record) => record.id === selectedId) ?? null;
  const availableClients = selected
    ? clientOptions.filter((client) => !selected.bookedClients.some((booked) => booked.id === client.id))
    : [];
  const weekStart = studioDateKeyAnchor(weekStartDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addStudioDays(weekStartDate, index),
  );
  const weekCapacity = records.reduce((sum, item) => sum + (item.capacity ?? 1), 0);
  const weekBooked = records.reduce((sum, item) => sum + item.bookedCount, 0);

  const timeRows = useMemo(() => {
    const map = new Map<number, string>();
    for (const record of filtered) {
      const minutes = getCairoMinutes(record.startsAt);
      if (!map.has(minutes)) map.set(minutes, record.startsAt);
    }
    return Array.from(map.entries()).sort((left, right) => left[0] - right[0]);
  }, [filtered]);

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
    setEditingId(record.id);
    setForm({
      title: record.title,
      description: record.focus,
      type: record.sessionType === "Group" ? "GROUP" : "PRIVATE",
      status: record.rawStatus,
      coachId: record.coachId,
      groupId: record.groupId ?? "",
      location: record.location,
      startsAt: toDateTimeLocal(record.startsAt),
      endsAt: toDateTimeLocal(record.endsAt),
      capacity: String(record.capacity ?? 1),
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
          location: form.location,
          startsAt: studioDateTimeLocalToIso(form.startsAt),
          endsAt: studioDateTimeLocalToIso(form.endsAt),
          capacity: form.type === "PRIVATE" ? 1 : Number(form.capacity) || null,
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
          sourceSessionId: requestForm.kind !== "RECURRING_WEEKDAYS" ? logRequestFor.sessionId : undefined,
          targetSessionId: requestForm.kind === "MOVE_OCCURRENCE" ? requestForm.targetSessionId : undefined,
          groupId: requestForm.kind === "RECURRING_WEEKDAYS" ? (logRequestFor.groupId ?? undefined) : undefined,
          fromWeekdays: requestForm.kind === "RECURRING_WEEKDAYS" ? requestForm.fromWeekdays : undefined,
          toWeekdays: requestForm.kind === "RECURRING_WEEKDAYS" ? requestForm.toWeekdays : undefined,
          effectiveFrom: requestForm.kind === "RECURRING_WEEKDAYS" ? requestForm.effectiveFrom : undefined,
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
        <div className={styles.headerActions}><button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><CalendarPlus2 size={17} /> New session</button></div>
      </header>

      <section className={styles.stats} aria-label="Schedule summary">
        {stats.map((stat) => <article key={stat.id}><span>{stat.label}</span><strong>{stat.value}</strong><p>{stat.change}</p></article>)}
        <article className={styles.utilization}><span>Seat utilization</span><strong>{weekCapacity ? Math.round((weekBooked / weekCapacity) * 100) : 0}%</strong><div><i style={{ width: `${weekCapacity ? Math.round((weekBooked / weekCapacity) * 100) : 0}%` }} /></div><p>{weekBooked} booked / {weekCapacity} places</p></article>
      </section>

      <section className={styles.reviewLayout}>
        <div className={styles.scheduler}>
          <div className={styles.schedulerTop}>
            <div className={styles.monthNav}><button type="button" aria-label="Previous week" onClick={() => navigateWeek(-1)} disabled={isPending}><ChevronLeft size={18} /></button><div><button type="button" className={styles.todayButton} onClick={navigateToday} disabled={isPending}>Today</button><strong>{monthFormatter.format(weekStart)}</strong></div><button type="button" aria-label="Next week" onClick={() => navigateWeek(1)} disabled={isPending}><ChevronRight size={18} /></button></div>
            <div className={styles.search}><Search size={17} /><label className="sr-only" htmlFor="schedule-search">Search schedule</label><input id="schedule-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Session, coach, group or room" /></div>
            <div className={styles.schedulerActions}><AdminRecurringSessionManager templates={recurringTemplates} coachOptions={coachOptions} groupOptions={groupOptions} defaultDurationMinutes={defaultDurationMinutes} /><button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><CalendarPlus2 size={17} /> New session</button></div>
          </div>
          <div className={styles.filterStrip}>
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>All</option><option>Confirmed</option><option>Waitlist</option><option>Attention</option><option>Completed</option></select></label>
            <label>Type<select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option>All</option><option>Group</option><option>Private</option></select></label>
            <label>Coach<select value={coach} onChange={(event) => setCoach(event.target.value)}><option value="all">All coaches</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label>
            <label>Group<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All groups</option><option value="none">No group</option>{groupOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            <span>{filtered.length} visible sessions</span>
          </div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          <div className={styles.weekScroll}>
            {timeRows.length === 0 ? (
              <p className={styles.gridEmpty}>No sessions match these filters.</p>
            ) : (
              <div className={styles.grid}>
                <div className={styles.gridCorner}>Cairo</div>
                {weekDays.map((dayKey) => {
                  const day = studioDateKeyAnchor(dayKey);
                  return <div className={styles.gridDayHeader} key={dayKey} data-today={dayKey === getStudioDateKey() || undefined}><span>{dayHeaderFormatter.format(day).split(",")[0]}</span><strong>{day.getUTCDate()}</strong></div>;
                })}
                {timeRows.map(([minutes, representativeIso]) => (
                  <Fragment key={minutes}>
                    <div className={styles.gridTimeLabel}>{timeFormatter.format(new Date(representativeIso))}</div>
                    {weekDays.map((dayKey) => {
                      const cellRecords = filtered.filter(
                        (record) => record.dayKey === dayKey && getCairoMinutes(record.startsAt) === minutes,
                      );
                      return (
                        <div className={styles.gridCell} key={`${dayKey}-${minutes}`}>
                          {cellRecords.map((record) => (
                            <button
                              type="button"
                              key={record.id}
                              className={styles.gridBlock}
                              style={{ borderLeftColor: coachColor(record.coachId) }}
                              data-canceled={record.rawStatus === "CANCELED" || undefined}
                              onClick={() => openDetails(record)}
                            >
                              <span className={styles.gridBlockTitle}>{record.title}</span>
                              <span className={styles.gridBlockCoach}>{record.coachName}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className={styles.requestsCard}>
          <div className={styles.sectionHeading}><div><span>Change requests</span><h2>Waiting</h2></div><small>{changeRequests.length} waiting</small></div>
          {requestNotice ? <p className={styles.summaryNotice} role="status">{requestNotice}</p> : null}
          {changeRequests.length === 0 ? (
            <p className={styles.noRequests}>No pending requests.</p>
          ) : (
            <div className={styles.requestList}>
              {changeRequests.map((request) => (
                <div className={styles.requestItem} key={request.id}>
                  <div className={styles.requestItemHead}>
                    <div><strong>{request.clientName}</strong><small>{request.reason}</small></div>
                    <span className={styles.requestBadge} data-recurring={request.kind === "RECURRING_WEEKDAYS" || undefined}>{request.kindLabel}</span>
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
        </aside>
      </section>

      <Dialog.Root open={detailsOpen && !!selected} onOpenChange={setDetailsOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}>{selected ? <>
        <Dialog.Title asChild><h2>{selected.title}</h2></Dialog.Title>
        <Dialog.Description>{selected.dayLabel}, {selected.dateLabel} · {selected.timeRange}</Dialog.Description>
        <Dialog.Close className={styles.close} aria-label="Close session details"><X size={18} /></Dialog.Close>
        <div className={styles.inspectorStatus}><span className={statusClass(selected.status)}>{selected.rawStatus === "CANCELED" ? "Canceled" : selected.status}</span><span>{selected.sessionType}</span></div>
        <dl><div><dt><Clock3 size={15} /> Time</dt><dd>{selected.dayLabel}, {selected.dateLabel}<br />{selected.timeRange}</dd></div><div><dt><ShieldUser size={15} /> Coach</dt><dd>{selected.coachName}</dd></div><div><dt><MapPin size={15} /> Location</dt><dd>{selected.location}</dd></div><div><dt><Users size={15} /> Capacity</dt><dd>{selected.occupancyLabel}<br />{selected.waitlistCount} waitlisted</dd></div><div><dt><Dumbbell size={15} /> Group</dt><dd>{selected.groupName}</dd></div></dl>
        <div className={styles.inspectorNote}><strong>Roster</strong>{selected.bookedClients.length ? <ul>{selected.bookedClients.map((client) => <li key={client.id}><span>{client.fullName} · {client.status}</span>{selected.rawStatus === "SCHEDULED" || selected.rawStatus === "DRAFT" ? <div><button type="button" onClick={() => openLogRequest(client)}><CalendarClock size={13} /> Log request</button><button type="button" disabled={isPending} onClick={() => setConfirmation({ kind: "remove-booking", sessionId: selected.id, clientId: client.id, label: client.fullName })}>Remove</button></div> : null}</li>)}</ul> : <p>No clients booked.</p>}{selected.rawStatus === "SCHEDULED" || selected.rawStatus === "DRAFT" ? <div><select aria-label="Client to add" value={bookingClientId} onChange={(event) => setBookingClientId(event.target.value)}><option value="">Select client</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select><button type="button" disabled={!bookingClientId || isPending} onClick={addBooking}><UserPlus size={14} /> Add</button></div> : null}</div>
        <div className={styles.inspectorNote}><strong>Training focus</strong><p>{selected.focus}</p></div>
        {selected.sourceTemplateId ? <div className={styles.inspectorNote}><strong><Repeat2 size={14} /> {selected.isTemplateException ? "Recurring exception" : "Recurring occurrence"}</strong><p>{selected.isTemplateException ? "This occurrence has an intentional day or time override." : "Editing or cancelling here changes this occurrence only."}</p></div> : null}
        <div className={styles.inspectorActions}>
          {selected.rawStatus !== "CANCELED" ? <button type="button" className="mv-btn mv-btn-primary" onClick={() => openEdit(selected)}>Edit session</button> : null}
          {selected.rawStatus === "DRAFT" || selected.rawStatus === "SCHEDULED" ? <button type="button" className={styles.cancelButton} onClick={() => setConfirmation({ kind: "cancel", sessionId: selected.id, label: selected.title, withinCancellationWindow: cancellationWindowMinutes > 0 && Date.parse(selected.startsAt) - Date.now() < cancellationWindowMinutes * 60_000 })} disabled={isPending}><XCircle size={16} /> Cancel session</button> : null}
          {selected.rawStatus === "DRAFT" && selected.bookedClients.length === 0 ? <button type="button" className={styles.cancelButton} onClick={() => setConfirmation({ kind: "delete", sessionId: selected.id, label: selected.title })} disabled={isPending}><Trash2 size={16} /> Delete draft</button> : null}
        </div>
      </> : null}</Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{editingId ? "Edit session" : "Create a session"}</Dialog.Title><Dialog.Description>Define the occurrence, linked group, coach, capacity, and location.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close session editor"><X size={18} /></Dialog.Close><form onSubmit={submitSession} className={styles.form}>
        <label className={styles.full}>Session title<input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></label>
        <label className={styles.full}>Training focus<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
        <label>Type<select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as SessionForm["type"] }))}><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label>
        <label>Status<select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as SessionForm["status"] }))}><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option></select></label>
        <label>Starts<input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm((value) => ({ ...value, startsAt: event.target.value }))} /></label>
        <label>Ends<input type="datetime-local" required value={form.endsAt} onChange={(event) => setForm((value) => ({ ...value, endsAt: event.target.value }))} /></label>
        <label>Coach<select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}><option value="">Select coach</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label>
        <label>Group<select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}><option value="">No linked group</option>{groupOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Capacity<input type="number" min="1" disabled={form.type === "PRIVATE"} value={form.type === "PRIVATE" ? "1" : form.capacity} onChange={(event) => setForm((value) => ({ ...value, capacity: event.target.value }))} /></label>
        <label>Location<input value={form.location} onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} placeholder="Studio floor or zone" /></label>
        {error ? <p className={`${styles.error} ${styles.full}`} role="alert">{error}</p> : null}
        <div className={`${styles.formActions} ${styles.full}`}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Close</button><button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Save session"}</button></div>
      </form></Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{confirmation?.kind === "remove-booking" ? "Remove this booking?" : confirmation?.kind === "delete" ? "Delete this draft?" : "Cancel this session?"}</Dialog.Title><Dialog.Description>{confirmation?.kind === "cancel" ? "Active bookings will be canceled with the session." : confirmation?.kind === "delete" ? "Only an empty draft can be permanently deleted." : `${confirmation?.label ?? "This client"} will be removed from the session roster.`}</Dialog.Description>{confirmation?.kind === "cancel" && confirmation.withinCancellationWindow ? <p className={styles.error}>This session starts within the studio&apos;s {cancellationWindowMinutes >= 60 ? `${cancellationWindowMinutes / 60}-hour` : `${cancellationWindowMinutes}-minute`} cancellation window. Clients may not have been notified in time.</p> : null}<div className={styles.formActions}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setConfirmation(null)}>Keep it</button><button type="button" className={styles.cancelButton} onClick={confirmMutation} disabled={isPending}>Confirm</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={!!logRequestFor} onOpenChange={(open) => !open && setLogRequestFor(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>Log a change request</Dialog.Title><Dialog.Description>{logRequestFor ? `On behalf of ${logRequestFor.clientName}.` : ""}</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close change request form"><X size={18} /></Dialog.Close><form onSubmit={submitChangeRequest} className={styles.form}>
        <label className={styles.full}>What changed?<select value={requestForm.kind} onChange={(event) => setRequestForm((value) => ({ ...value, kind: event.target.value as RequestForm["kind"] }))}>
          <option value="CANCEL_OCCURRENCE">Cancel this booking</option>
          <option value="MOVE_OCCURRENCE">Move to a different session</option>
          {logRequestFor?.groupId ? <option value="RECURRING_WEEKDAYS">Change weekly days</option> : null}
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
        {requestError ? <p className={`${styles.error} ${styles.full}`} role="alert">{requestError}</p> : null}
        <div className={`${styles.formActions} ${styles.full}`}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setLogRequestFor(null)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Logging…" : "Log request"}</button></div>
      </form></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
