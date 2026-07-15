"use client";

import { useDeferredValue, useMemo, useState, useTransition, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarPlus2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Repeat2,
  Search,
  ShieldUser,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { bulkUpdateAdminSessions, cancelAdminSession, saveAdminSession } from "@/app/actions/admin-sessions";
import type { AdminScheduleSessionRecord, AdminScheduleStat } from "@/lib/dashboard/admin-schedule-data";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";
import type { AdminScheduleGroupOption } from "@/lib/repositories/admin-schedule-repository";
import styles from "./admin-schedule-workspace.module.css";

type Props = {
  stats: AdminScheduleStat[];
  records: AdminScheduleSessionRecord[];
  coachOptions: AdminSessionCoachOption[];
  groupOptions: AdminScheduleGroupOption[];
  weekStartIso: string;
};

type SessionForm = {
  title: string;
  type: "GROUP" | "PRIVATE";
  status: "DRAFT" | "SCHEDULED" | "COMPLETED" | "CANCELED";
  coachId: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
};

type BulkAction = "CANCEL" | "REASSIGN_COACH" | "UPDATE_LOCATION" | "UPDATE_CAPACITY";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" });
const dayHeaderFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", weekday: "short", month: "short", day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "numeric", minute: "2-digit" });

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function createEmptyForm(coachId = ""): SessionForm {
  const starts = new Date();
  starts.setMinutes(0, 0, 0);
  starts.setHours(starts.getHours() + 1);
  const ends = new Date(starts.getTime() + 60 * 60 * 1000);
  return { title: "", type: "GROUP", status: "SCHEDULED", coachId, location: "", startsAt: toDateTimeLocal(starts.toISOString()), endsAt: toDateTimeLocal(ends.toISOString()), capacity: "12" };
}

function mapStatus(status: AdminScheduleSessionRecord["status"]): SessionForm["status"] {
  if (status === "Completed") return "COMPLETED";
  if (status === "Attention") return "DRAFT";
  return "SCHEDULED";
}

function statusClass(status: AdminScheduleSessionRecord["status"]) {
  if (status === "Confirmed") return styles.confirmed;
  if (status === "Waitlist") return styles.waitlist;
  if (status === "Completed") return styles.completed;
  return styles.attention;
}

function getCairoMinutes(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function sessionPosition(record: AdminScheduleSessionRecord) {
  const start = getCairoMinutes(record.startsAt);
  const end = getCairoMinutes(record.endsAt);
  const top = Math.max(0, ((start - 7 * 60) / 60) * 64);
  const height = Math.max(48, ((Math.max(end, start + 45) - start) / 60) * 64);
  return { "--session-top": `${top}px`, "--session-height": `${height}px` } as CSSProperties;
}

export function AdminScheduleWorkspace({ stats, records, coachOptions, groupOptions, weekStartIso }: Props) {
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(() => createEmptyForm(coachOptions[0]?.id));
  const [bulkAction, setBulkAction] = useState<BulkAction>("CANCEL");
  const [bulkValue, setBulkValue] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const groupName = groupOptions.find((item) => item.id === group)?.name;
    return records.filter((record) =>
      (!query || [record.title, record.coachName, record.groupName, record.location].join(" ").toLowerCase().includes(query)) &&
      (status === "All" || record.status === status) &&
      (type === "All" || record.sessionType === type) &&
      (coach === "all" || record.coachId === coach) &&
      (group === "all" || (group === "none" ? record.groupName === "No linked group" : record.groupName === groupName))
    );
  }, [coach, deferredSearch, group, groupOptions, records, status, type]);

  const selected = filtered.find((record) => record.id === selectedId) ?? filtered[0] ?? null;
  const weekStart = new Date(weekStartIso);
  weekStart.setHours(12, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return date; });
  const hours = Array.from({ length: 16 }, (_, index) => index + 7);
  const weekCapacity = records.reduce((sum, item) => sum + (item.capacity ?? 1), 0);
  const weekBooked = records.reduce((sum, item) => sum + item.bookedCount, 0);

  function navigateWeek(offset: number) {
    const target = new Date(weekStart);
    target.setDate(target.getDate() + offset * 7);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", dayKeyFormatter.format(target));
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
    setEditingId(record.id);
    setForm({ title: record.title, type: record.sessionType === "Group" ? "GROUP" : "PRIVATE", status: mapStatus(record.status), coachId: record.coachId, location: record.location, startsAt: toDateTimeLocal(record.startsAt), endsAt: toDateTimeLocal(record.endsAt), capacity: String(record.capacity ?? 1) });
    setError("");
    setEditorOpen(true);
  }

  function submitSession(event: FormEvent) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await saveAdminSession({ sessionId: editingId, title: form.title, type: form.type, status: form.status, coachId: form.coachId, location: form.location, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), capacity: form.type === "PRIVATE" ? 1 : Number(form.capacity) || null });
        setEditorOpen(false);
        router.refresh();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save the session."); }
    });
  }

  function cancelSession(id: string) {
    setError("");
    startTransition(async () => {
      try { await cancelAdminSession(id); router.refresh(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "Could not cancel the session."); }
    });
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function applyBulk() {
    if (!selectedIds.length) return;
    setError("");
    startTransition(async () => {
      try {
        await bulkUpdateAdminSessions({ sessionIds: selectedIds, action: bulkAction, coachId: bulkAction === "REASSIGN_COACH" ? bulkValue : undefined, location: bulkAction === "UPDATE_LOCATION" ? bulkValue : undefined, capacity: bulkAction === "UPDATE_CAPACITY" ? Number(bulkValue) : undefined });
        setSelectedIds([]); setBulkValue(""); router.refresh();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update selected sessions."); }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      <header className={styles.header}><div><span className={styles.kicker}>Studio calendar</span><h1>Program the week.</h1><p>See coach coverage, capacity pressure and every training block in one timeline.</p></div><div className={styles.headerActions}><Link href="/admin/schedule/templates" className="mv-btn mv-btn-secondary"><Repeat2 size={17} /> Templates</Link><button type="button" className="mv-btn mv-btn-primary" onClick={openCreate}><CalendarPlus2 size={17} /> New session</button></div></header>

      <section className={styles.stats} aria-label="Schedule summary">
        {stats.map((stat) => <article key={stat.id}><span>{stat.label}</span><strong>{stat.value}</strong><p>{stat.change}</p></article>)}
        <article className={styles.utilization}><span>Seat utilization</span><strong>{weekCapacity ? Math.round((weekBooked / weekCapacity) * 100) : 0}%</strong><div><i style={{ width: `${weekCapacity ? Math.round((weekBooked / weekCapacity) * 100) : 0}%` }} /></div><p>{weekBooked} booked / {weekCapacity} places</p></article>
      </section>

      <section className={styles.scheduler}>
        <div className={styles.schedulerTop}><div className={styles.monthNav}><button type="button" aria-label="Previous week" onClick={() => navigateWeek(-1)} disabled={isPending}><ChevronLeft size={18} /></button><div><button type="button" className={styles.todayButton} onClick={navigateToday} disabled={isPending}>Today</button><strong>{monthFormatter.format(weekStart)}</strong></div><button type="button" aria-label="Next week" onClick={() => navigateWeek(1)} disabled={isPending}><ChevronRight size={18} /></button></div><div className={styles.search}><Search size={17} /><label className="sr-only" htmlFor="schedule-search">Search schedule</label><input id="schedule-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Session, coach, group or room" /></div><span className={styles.filterButton}><Filter size={17} /> Live filters</span></div>
        <div className={styles.filterStrip}><label>Status<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>All</option><option>Confirmed</option><option>Waitlist</option><option>Attention</option><option>Completed</option></select></label><label>Type<select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option>All</option><option>Group</option><option>Private</option></select></label><label>Coach<select value={coach} onChange={(event) => setCoach(event.target.value)}><option value="all">All coaches</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label><label>Group<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All groups</option><option value="none">No group</option>{groupOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><span>{filtered.length} visible sessions</span></div>

        {selectedIds.length ? <div className={styles.bulkBar}><strong>{selectedIds.length} selected</strong><select value={bulkAction} onChange={(event) => { setBulkAction(event.target.value as BulkAction); setBulkValue(""); }}><option value="CANCEL">Cancel sessions</option><option value="REASSIGN_COACH">Reassign coach</option><option value="UPDATE_LOCATION">Change location</option><option value="UPDATE_CAPACITY">Change capacity</option></select>{bulkAction === "REASSIGN_COACH" ? <select value={bulkValue} onChange={(event) => setBulkValue(event.target.value)}><option value="">Select coach</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select> : bulkAction !== "CANCEL" ? <input value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} placeholder={bulkAction === "UPDATE_LOCATION" ? "New location" : "New capacity"} /> : null}<button onClick={applyBulk} disabled={isPending || (bulkAction !== "CANCEL" && !bulkValue)}>Apply update</button><button className={styles.clearBulk} onClick={() => setSelectedIds([])} aria-label="Clear selection"><X size={17} /></button></div> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <div className={styles.weekScroll}>
          <div className={styles.calendar}>
            <div className={styles.corner}>GMT+3</div>
            {weekDays.map((day) => <div className={styles.dayHeader} key={day.toISOString()} data-today={dayKeyFormatter.format(day) === dayKeyFormatter.format(new Date()) || undefined}><span>{dayHeaderFormatter.format(day).split(",")[0]}</span><strong>{day.getDate()}</strong></div>)}
            <div className={styles.timeRail}>{hours.map((hour) => <span key={hour}>{hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}</span>)}</div>
            {weekDays.map((day) => {
              const dayKey = dayKeyFormatter.format(day);
              const dayRecords = filtered.filter((record) => dayKeyFormatter.format(new Date(record.startsAt)) === dayKey);
              return <div className={styles.dayColumn} key={dayKey}>{hours.map((hour) => <i key={hour} />)}{dayRecords.map((record) => <article key={record.id} className={`${styles.sessionBlock} ${statusClass(record.status)}`} style={sessionPosition(record)} data-selected={selected?.id === record.id || undefined}><button type="button" onClick={() => setSelectedId(record.id)}><span>{record.title}</span><small>{timeFormatter.format(new Date(record.startsAt))}</small><em>{record.coachName}</em></button><label aria-label={`Select ${record.title}`}><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleSelection(record.id)} /><Check size={12} /></label></article>)}</div>;
            })}
          </div>
        </div>
      </section>

      <section className={styles.detailLayout}>
        <article className={styles.agenda}><div className={styles.sectionHeading}><div><span>Week agenda</span><h2>All occurrences</h2></div><small>{filtered.length} sessions</small></div><div>{filtered.map((record) => <button type="button" key={record.id} data-active={selected?.id === record.id || undefined} onClick={() => setSelectedId(record.id)}><time><strong>{timeFormatter.format(new Date(record.startsAt))}</strong><span>{dayHeaderFormatter.format(new Date(record.startsAt))}</span></time><div><strong>{record.title}</strong><span>{record.coachName} · {record.location}</span></div><span className={statusClass(record.status)}>{record.status}</span><ChevronRight size={17} /></button>)}</div></article>
        <aside className={styles.inspector}><div className={styles.sectionHeading}><div><span>Selected session</span><h2>{selected?.title ?? "Nothing selected"}</h2></div></div>{selected ? <><div className={styles.inspectorStatus}><span className={statusClass(selected.status)}>{selected.status}</span><span>{selected.sessionType}</span></div><dl><div><dt><Clock3 size={15} /> Time</dt><dd>{selected.dayLabel}, {selected.dateLabel}<br />{selected.timeRange}</dd></div><div><dt><ShieldUser size={15} /> Coach</dt><dd>{selected.coachName}</dd></div><div><dt><MapPin size={15} /> Location</dt><dd>{selected.location}</dd></div><div><dt><Users size={15} /> Capacity</dt><dd>{selected.occupancyLabel}<br />{selected.waitlistCount} waitlisted</dd></div></dl><div className={styles.inspectorNote}><strong>Training focus</strong><p>{selected.focus}</p></div><div className={styles.inspectorActions}><button className="mv-btn mv-btn-primary" onClick={() => openEdit(selected)}>Edit session</button>{selected.status !== "Completed" ? <button className={styles.cancelButton} onClick={() => cancelSession(selected.id)} disabled={isPending}><XCircle size={16} /> Cancel</button> : null}</div></> : <p className={styles.noSelection}>Choose a session from the calendar.</p>}</aside>
      </section>

      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.editor}><Dialog.Title>{editingId ? "Edit session" : "Create a session"}</Dialog.Title><Dialog.Description>Define the training block, coach, capacity and floor location.</Dialog.Description><Dialog.Close className={styles.close} aria-label="Close session editor"><X size={18} /></Dialog.Close><form onSubmit={submitSession} className={styles.form}><label className={styles.full}>Session title<input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></label><label>Type<select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as SessionForm["type"] }))}><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label><label>Status<select value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as SessionForm["status"] }))}><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option><option value="CANCELED">Canceled</option></select></label><label>Starts<input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm((value) => ({ ...value, startsAt: event.target.value }))} /></label><label>Ends<input type="datetime-local" required value={form.endsAt} onChange={(event) => setForm((value) => ({ ...value, endsAt: event.target.value }))} /></label><label>Coach<select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}><option value="">Select coach</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label><label>Capacity<input type="number" min="1" disabled={form.type === "PRIVATE"} value={form.type === "PRIVATE" ? "1" : form.capacity} onChange={(event) => setForm((value) => ({ ...value, capacity: event.target.value }))} /></label><label className={styles.full}>Location<input value={form.location} onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} placeholder="Studio floor or zone" /></label>{error ? <p className={styles.error} role="alert">{error}</p> : null}<div className={`${styles.formActions} ${styles.full}`}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="mv-btn mv-btn-primary" disabled={isPending}>{isPending ? "Saving…" : "Save session"}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
