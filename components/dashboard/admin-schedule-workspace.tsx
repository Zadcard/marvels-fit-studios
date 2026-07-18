"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Dialog } from "radix-ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarPlus2,
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
  | { kind: "cancel" | "delete"; sessionId: string; label: string }
  | { kind: "remove-booking"; sessionId: string; clientId: string; label: string };

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

function createEmptyForm(coachId = ""): SessionForm {
  const starts = new Date();
  starts.setMinutes(0, 0, 0);
  starts.setHours(starts.getHours() + 1);
  const ends = new Date(starts.getTime() + 60 * 60 * 1000);
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

function sessionPosition(record: AdminScheduleSessionRecord) {
  const start = getCairoMinutes(record.startsAt);
  const end = getCairoMinutes(record.endsAt);
  const top = Math.max(0, ((start - 7 * 60) / 60) * 64);
  const height = Math.max(48, ((Math.max(end, start + 45) - start) / 60) * 64);
  return {
    "--session-top": `${top}px`,
    "--session-height": `${height}px`,
  } as CSSProperties;
}

export function AdminScheduleWorkspace({
  stats,
  records,
  coachOptions,
  groupOptions,
  clientOptions,
  recurringTemplates,
  weekStartDate,
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(() => createEmptyForm(coachOptions[0]?.id));
  const [bookingClientId, setBookingClientId] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");

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
  const selected = filtered.find((record) => record.id === selectedId) ?? filtered[0] ?? null;
  const availableClients = selected
    ? clientOptions.filter((client) => !selected.bookedClients.some((booked) => booked.id === client.id))
    : [];
  const weekStart = studioDateKeyAnchor(weekStartDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addStudioDays(weekStartDate, index),
  );
  const hours = Array.from({ length: 16 }, (_, index) => index + 7);
  const weekCapacity = records.reduce((sum, item) => sum + (item.capacity ?? 1), 0);
  const weekBooked = records.reduce((sum, item) => sum + item.bookedCount, 0);

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
    setForm(createEmptyForm(coachOptions[0]?.id));
    setError("");
    setEditorOpen(true);
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

      <section className={styles.scheduler}>
        <div className={styles.schedulerTop}>
          <div className={styles.monthNav}><button type="button" aria-label="Previous week" onClick={() => navigateWeek(-1)} disabled={isPending}><ChevronLeft size={18} /></button><div><button type="button" className={styles.todayButton} onClick={navigateToday} disabled={isPending}>Today</button><strong>{monthFormatter.format(weekStart)}</strong></div><button type="button" aria-label="Next week" onClick={() => navigateWeek(1)} disabled={isPending}><ChevronRight size={18} /></button></div>
          <div className={styles.search}><Search size={17} /><label className="sr-only" htmlFor="schedule-search">Search schedule</label><input id="schedule-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Session, coach, group or room" /></div>
          <div className={styles.schedulerActions}><AdminRecurringSessionManager templates={recurringTemplates} coachOptions={coachOptions} groupOptions={groupOptions} /><button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><CalendarPlus2 size={17} /> New session</button></div>
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
          <div className={styles.calendar}>
            <div className={styles.corner}>Cairo</div>
            {weekDays.map((dayKey) => {
              const day = studioDateKeyAnchor(dayKey);
              return <div className={styles.dayHeader} key={dayKey} data-today={dayKey === getStudioDateKey() || undefined}><span>{dayHeaderFormatter.format(day).split(",")[0]}</span><strong>{day.getUTCDate()}</strong></div>;
            })}
            <div className={styles.timeRail}>{hours.map((hour) => <span key={hour}>{hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}</span>)}</div>
            {weekDays.map((dayKey) => {
              const dayRecords = filtered.filter((record) => record.dayKey === dayKey);
              return <div className={styles.dayColumn} key={dayKey}>{hours.map((hour) => <i key={hour} />)}{dayRecords.map((record) => <article key={record.id} className={`${styles.sessionBlock} ${statusClass(record.status)}`} style={sessionPosition(record)} data-selected={selected?.id === record.id || undefined}><button type="button" onClick={() => setSelectedId(record.id)}><span>{record.title}</span><small>{timeFormatter.format(new Date(record.startsAt))}</small><em>{record.coachName}</em></button></article>)}</div>;
            })}
          </div>
        </div>
      </section>

      <section className={styles.detailLayout}>
        <article className={styles.agenda}>
          <div className={styles.sectionHeading}><div><span>Week agenda</span><h2>All occurrences</h2></div><small>{filtered.length} sessions</small></div>
          <div>{filtered.map((record) => <button type="button" key={record.id} data-active={selected?.id === record.id || undefined} onClick={() => setSelectedId(record.id)}><time><strong>{timeFormatter.format(new Date(record.startsAt))}</strong><span>{dayHeaderFormatter.format(new Date(record.startsAt))}</span></time><div><strong>{record.title}</strong><span>{record.coachName} · {record.groupName} · {record.location}</span></div><span className={statusClass(record.status)}>{record.rawStatus === "CANCELED" ? "Canceled" : record.status}</span><ChevronRight size={17} /></button>)}</div>
        </article>

        <aside className={styles.inspector}>
          <div className={styles.sectionHeading}><div><span>Selected session</span><h2>{selected?.title ?? "Nothing selected"}</h2></div></div>
          {selected ? <>
            <div className={styles.inspectorStatus}><span className={statusClass(selected.status)}>{selected.rawStatus === "CANCELED" ? "Canceled" : selected.status}</span><span>{selected.sessionType}</span></div>
            <dl><div><dt><Clock3 size={15} /> Time</dt><dd>{selected.dayLabel}, {selected.dateLabel}<br />{selected.timeRange}</dd></div><div><dt><ShieldUser size={15} /> Coach</dt><dd>{selected.coachName}</dd></div><div><dt><MapPin size={15} /> Location</dt><dd>{selected.location}</dd></div><div><dt><Users size={15} /> Capacity</dt><dd>{selected.occupancyLabel}<br />{selected.waitlistCount} waitlisted</dd></div><div><dt><Dumbbell size={15} /> Group</dt><dd>{selected.groupName}</dd></div></dl>
            <div className={styles.inspectorNote}><strong>Roster</strong>{selected.bookedClients.length ? <ul>{selected.bookedClients.map((client) => <li key={client.id}><span>{client.fullName} · {client.status}</span>{selected.rawStatus === "SCHEDULED" || selected.rawStatus === "DRAFT" ? <button type="button" disabled={isPending} onClick={() => setConfirmation({ kind: "remove-booking", sessionId: selected.id, clientId: client.id, label: client.fullName })}>Remove</button> : null}</li>)}</ul> : <p>No clients booked.</p>}{selected.rawStatus === "SCHEDULED" || selected.rawStatus === "DRAFT" ? <div><select aria-label="Client to add" value={bookingClientId} onChange={(event) => setBookingClientId(event.target.value)}><option value="">Select client</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select><button type="button" disabled={!bookingClientId || isPending} onClick={addBooking}><UserPlus size={14} /> Add</button></div> : null}</div>
            <div className={styles.inspectorNote}><strong>Training focus</strong><p>{selected.focus}</p></div>
            {selected.sourceTemplateId ? <div className={styles.inspectorNote}><strong><Repeat2 size={14} /> {selected.isTemplateException ? "Recurring exception" : "Recurring occurrence"}</strong><p>{selected.isTemplateException ? "This occurrence has an intentional day or time override." : "Editing or cancelling here changes this occurrence only."}</p></div> : null}
            <div className={styles.inspectorActions}>
              {selected.rawStatus !== "CANCELED" ? <button type="button" className="mv-btn mv-btn-primary" onClick={() => openEdit(selected)}>Edit session</button> : null}
              {selected.rawStatus === "DRAFT" || selected.rawStatus === "SCHEDULED" ? <button type="button" className={styles.cancelButton} onClick={() => setConfirmation({ kind: "cancel", sessionId: selected.id, label: selected.title })} disabled={isPending}><XCircle size={16} /> Cancel session</button> : null}
              {selected.rawStatus === "DRAFT" && selected.bookedClients.length === 0 ? <button type="button" className={styles.cancelButton} onClick={() => setConfirmation({ kind: "delete", sessionId: selected.id, label: selected.title })} disabled={isPending}><Trash2 size={16} /> Delete draft</button> : null}
            </div>
          </> : <p className={styles.noSelection}>Choose a session from the calendar.</p>}
        </aside>
      </section>

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

      <Dialog.Root open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{confirmation?.kind === "remove-booking" ? "Remove this booking?" : confirmation?.kind === "delete" ? "Delete this draft?" : "Cancel this session?"}</Dialog.Title><Dialog.Description>{confirmation?.kind === "cancel" ? "Active bookings will be canceled with the session." : confirmation?.kind === "delete" ? "Only an empty draft can be permanently deleted." : `${confirmation?.label ?? "This client"} will be removed from the session roster.`}</Dialog.Description><div className={styles.formActions}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setConfirmation(null)}>Keep it</button><button type="button" className={styles.cancelButton} onClick={confirmMutation} disabled={isPending}>Confirm</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
