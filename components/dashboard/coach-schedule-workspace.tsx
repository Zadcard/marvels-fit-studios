"use client";

import { Fragment, useDeferredValue, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Clock3,
  Dumbbell,
  Repeat2,
  Search,
  ShieldUser,
  Users,
  X,
} from "lucide-react";

import type {
  AdminScheduleSessionRecord,
  AdminScheduleStat,
} from "@/lib/dashboard/admin-schedule-data";
import {
  addStudioDays,
  getStudioDateKey,
  studioDateKeyAnchor,
  STUDIO_TIME_ZONE,
} from "@/lib/time/studio-time";
import styles from "./admin-schedule-workspace.module.css";

type Props = {
  stats: AdminScheduleStat[];
  records: AdminScheduleSessionRecord[];
  weekStartDate: string;
  isSupervisor: boolean;
  coachName: string;
};

const coachColorPalette = ["#e62429", "#2f8f5b", "#3b6fe0", "#8b5cf6", "#d97706", "#0891b2"];

function coachColor(coachId: string) {
  let hash = 0;
  for (let index = 0; index < coachId.length; index += 1) {
    hash = (hash * 31 + coachId.charCodeAt(index)) >>> 0;
  }
  return coachColorPalette[hash % coachColorPalette.length];
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

function formatHourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
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

export function CoachScheduleWorkspace({
  stats,
  records,
  weekStartDate,
  isSupervisor,
  coachName,
}: Props) {
  const router = useRouter();
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const coachOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const record of records) map.set(record.coachId, record.coachName);
    return Array.from(map, ([id, fullName]) => ({ id, fullName })).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  }, [records]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((record) =>
      (!query || [record.title, record.coachName, record.groupName].join(" ").toLowerCase().includes(query)) &&
      (status === "All" || record.status === status) &&
      (type === "All" || record.sessionType === type) &&
      (coach === "all" || record.coachId === coach),
    );
  }, [coach, deferredSearch, records, status, type]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, AdminScheduleSessionRecord[]> = {};
    for (const dayKey of weekDays) map[dayKey] = [];
    for (const record of filtered) {
      if (map[record.dayKey]) map[record.dayKey].push(record);
    }
    for (const dayKey of Object.keys(map)) {
      map[dayKey].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
    }
    return map;
  }, [filtered, weekDays]);

  const selected = filtered.find((record) => record.id === selectedId) ?? null;
  const weekStart = studioDateKeyAnchor(weekStartDate);

  const timeRows = useMemo(() => {
    const hours: number[] = [];
    for (let h = 8; h <= 23; h += 1) hours.push(h);
    hours.push(0);
    return hours.map((hour) => ({ hour, minutes: hour * 60, label: formatHourLabel(hour) }));
  }, []);

  function navigateWeek(offset: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("week", addStudioDays(weekStartDate, offset * 7));
    router.push(`/coach/schedule?${params.toString()}`);
  }

  function navigateToday() {
    const params = new URLSearchParams(window.location.search);
    params.delete("week");
    router.push(`/coach/schedule?${params.toString()}`);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>My calendar</span>
          <h1>{coachName}&apos;s schedule.</h1>
          <p>
            {isSupervisor
              ? "Every session across the programs you supervise, plus anything you personally coach."
              : "Sessions you personally coach."}
          </p>
        </div>
      </header>

      <section className={styles.stats} aria-label="Schedule summary">
        {stats.map((stat) => (
          <article key={stat.id}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.change}</p>
          </article>
        ))}
      </section>

      <section className={styles.reviewLayout} data-requests-collapsed>
        <div className={styles.scheduler}>
          <div className={styles.schedulerTop}>
            <div className={styles.monthNav}>
              <button type="button" aria-label="Previous week" onClick={() => navigateWeek(-1)}>
                &lsaquo;
              </button>
              <div>
                <button type="button" className={styles.todayButton} onClick={navigateToday}>
                  Today
                </button>
                <strong>{monthFormatter.format(weekStart)}</strong>
              </div>
              <button type="button" aria-label="Next week" onClick={() => navigateWeek(1)}>
                &rsaquo;
              </button>
            </div>

            <div className={styles.viewToggleStrip}>
              <button type="button" className={styles.viewToggleButton} data-active={viewMode === "agenda" || undefined} onClick={() => setViewMode("agenda")} title="Agenda timeline view">
                Agenda
              </button>
              <button type="button" className={styles.viewToggleButton} data-active={viewMode === "week" || undefined} onClick={() => setViewMode("week")} title="Week columns view">
                Week Cards
              </button>
              <button type="button" className={styles.viewToggleButton} data-active={viewMode === "grid" || undefined} onClick={() => setViewMode("grid")} title="Hourly matrix grid">
                Hourly Grid
              </button>
            </div>

            <div className={styles.search}>
              <Search size={17} />
              <label className="sr-only" htmlFor="coach-schedule-search">Search schedule</label>
              <input id="coach-schedule-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Session, coach or group" />
            </div>
          </div>
          <div className={styles.filterStrip}>
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>All</option><option>Upcoming</option><option>Live</option><option>Completed</option></select></label>
            <label>Type<select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option>All</option><option>Group</option><option>Private</option></select></label>
            {isSupervisor && coachOptions.length > 1 ? (
              <label>Coach<select value={coach} onChange={(event) => setCoach(event.target.value)}><option value="all">All coaches</option>{coachOptions.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</select></label>
            ) : null}
            <span>{filtered.length} visible sessions</span>
          </div>

          {viewMode === "agenda" ? (
            <>
              <div className={styles.dateRibbon}>
                {weekDays.map((dayKey) => {
                  const day = studioDateKeyAnchor(dayKey);
                  const count = sessionsByDay[dayKey]?.length ?? 0;
                  const isSelected = selectedDayKey === dayKey;
                  const isToday = dayKey === todayKey;
                  const dayName = dayHeaderFormatter.format(day).split(",")[0];
                  const dayNum = day.getUTCDate();
                  return (
                    <button key={dayKey} type="button" className={styles.dateChip} data-active={isSelected || undefined} data-today={isToday || undefined} onClick={() => setSelectedDayKey(dayKey)}>
                      {isToday && <span className={styles.todayDot} title="Today" />}
                      <span className={styles.dateChipName}>{dayName}</span>
                      <span className={styles.dateChipNum}>{dayNum}</span>
                      <span className={styles.dateChipBadge}>{count} {count === 1 ? "session" : "sessions"}</span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const activeDayDate = studioDateKeyAnchor(selectedDayKey);
                const activeSessions = sessionsByDay[selectedDayKey] ?? [];
                return (
                  <div className={styles.agendaContainer}>
                    <div className={styles.agendaHeader}>
                      <div className={styles.agendaTitleGroup}>
                        <h2>{dayHeaderFormatter.format(activeDayDate)}</h2>
                        <p>{activeSessions.length} {activeSessions.length === 1 ? "scheduled session" : "scheduled sessions"} ordered chronologically</p>
                      </div>
                    </div>

                    {activeSessions.length === 0 ? (
                      <div className={styles.emptyAgenda}>
                        <CalendarClock size={32} style={{ opacity: 0.5, color: "var(--rl-muted)" }} />
                        <h3>No Sessions Scheduled</h3>
                        <p>There are no sessions on your calendar for this day.</p>
                      </div>
                    ) : (
                      <div className={styles.agendaTimeline}>
                        {activeSessions.map((record) => (
                          <article key={record.id} className={styles.agendaCard} style={{ borderLeftColor: coachColor(record.coachId) }}>
                            <div className={styles.agendaTimeCol}>
                              <span className={styles.agendaTimeRange}>{record.timeRange}</span>
                            </div>
                            <div className={styles.agendaMainCol}>
                              <span className={styles.agendaSessionTitle}>{record.title}</span>
                              <div className={styles.agendaMetaRow}>
                                <span className={styles.coachTag}><ShieldUser size={12} /> {record.coachName}</span>
                                {record.groupName && record.groupName !== "No linked group" && <span className={styles.groupTag}>{record.groupName}</span>}
                                <span className={styles.capacityPill}><Users size={12} /> {record.bookedCount} booked</span>
                              </div>
                            </div>
                            <span className={statusClass(record.status)}>
                              {record.rawStatus === "CANCELED" ? "Canceled" : record.status === "Live" ? "🔴 Live now" : record.status === "Upcoming" ? "Upcoming" : record.status === "Completed" ? "Ended" : record.status}
                            </span>
                            <div className={styles.agendaActions}>
                              <button type="button" onClick={() => router.push(`/coach/sessions?session=${encodeURIComponent(record.id)}`)} title="Open in Sessions for attendance & notes">
                                Attendance
                              </button>
                              <button type="button" onClick={() => setSelectedId(record.id)} title="View roster & session details">
                                Details
                              </button>
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
                    </div>
                    <div className={styles.weekColumnStack}>
                      {daySessions.length === 0 ? (
                        <span className={styles.noSessionsText}>No sessions</span>
                      ) : (
                        daySessions.map((record) => (
                          <div key={record.id} className={styles.weekSessionBlock} style={{ borderLeftColor: coachColor(record.coachId) }} onClick={() => setSelectedId(record.id)}>
                            <span className={styles.weekSessionTime}>{record.timeRange}</span>
                            <span className={styles.weekSessionTitle}>{record.title}</span>
                            <span className={styles.weekSessionCoach}>{record.coachName}</span>
                            {record.groupName && record.groupName !== "No linked group" && <span className={styles.weekSessionGroupTag}>{record.groupName}</span>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
                  {timeRows.map(({ hour, label }) => (
                    <Fragment key={hour}>
                      <div className={styles.gridTimeLabel}>{label}</div>
                      {weekDays.map((dayKey) => {
                        const cellRecords = filtered.filter(
                          (record) => record.dayKey === dayKey && Math.floor(getCairoMinutes(record.startsAt) / 60) === hour,
                        );
                        return (
                          <div className={styles.gridCell} key={`${dayKey}-${hour}`} data-today={dayKey === getStudioDateKey() || undefined}>
                            {cellRecords.length === 0 ? null : (
                              <div className={styles.gridCellBlockGroup}>
                                {cellRecords.length > 1 && (
                                  <div className={styles.multiSessionBadge}><Repeat2 size={10} /> {cellRecords.length} Sessions at {label}</div>
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
                                    onClick={() => setSelectedId(record.id)}
                                  >
                                    <span className={styles.gridBlockTime}>{record.timeRange}</span>
                                    <span className={styles.gridBlockTitle}>{record.title}</span>
                                    {record.groupName && record.groupName !== "No linked group" && <span className={styles.gridBlockGroupTag}>{record.groupName}</span>}
                                    <span className={styles.gridBlockCoach}>{record.coachName}</span>
                                    <span className={styles.gridBlockCapacity}><Users size={10} /> {record.bookedCount} booked</span>
                                  </button>
                                ))}
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
      </section>

      <Dialog.Root open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.inspectorModal}>
            {selected ? (
              <>
                <div className={styles.inspectorHeader}>
                  <div>
                    <div className={styles.inspectorBadges}>
                      <span className={styles.typeBadge}>{selected.sessionType}</span>
                      <span className={statusClass(selected.status)}>{selected.rawStatus === "CANCELED" ? "Canceled" : selected.status}</span>
                    </div>
                    <Dialog.Title className={styles.inspectorTitle}>{selected.title}</Dialog.Title>
                    <Dialog.Description className={styles.inspectorSubtitle}>
                      {selected.dayLabel}, {selected.dateLabel} &middot; {selected.timeRange}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className={styles.close} aria-label="Close session details"><X size={18} /></Dialog.Close>
                </div>

                <div className={styles.inspectorGrid}>
                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}><Clock3 size={14} /><span>Time & Date</span></div>
                    <strong>{selected.dayLabel}, {selected.dateLabel}</strong>
                    <small>{selected.timeRange}</small>
                  </div>
                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}><ShieldUser size={14} /><span>Coach</span></div>
                    <strong>{selected.coachName}</strong>
                    <small>Session Lead</small>
                  </div>
                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}><Users size={14} /><span>Bookings</span></div>
                    <strong>{selected.bookedCount} Booked</strong>
                    <small>{selected.waitlistCount} Waitlisted</small>
                  </div>
                  <div className={styles.inspectorGridCard}>
                    <div className={styles.inspectorCardHead}><Dumbbell size={14} /><span>Group</span></div>
                    <strong>{selected.groupName}</strong>
                    <small>{selected.trainingCategory ?? "Category"}</small>
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
                                {client.status === "ATTENDED" ? "Attended" : client.status === "MISSED" ? "Absent" : client.status === "WAITLIST" ? "Waitlist" : client.status}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyRosterText}>No clients booked for this session.</p>
                  )}
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
                      <Repeat2 size={14} /> {selected.isTemplateException ? "Recurring exception" : "Recurring occurrence"}
                    </h3>
                    <p className={styles.emptyRosterText}>
                      {selected.isTemplateException ? "This occurrence has an intentional day or time override." : "Part of a recurring series."}
                    </p>
                  </div>
                ) : null}

                <div className={styles.inspectorFooter}>
                  <button
                    type="button"
                    className="mv-btn mv-btn-primary"
                    onClick={() => router.push(`/coach/sessions?session=${encodeURIComponent(selected.id)}`)}
                  >
                    Open in Sessions &rarr;
                  </button>
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
