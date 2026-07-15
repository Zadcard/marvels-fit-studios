"use client";

import { useDeferredValue, useMemo, useState, type CSSProperties } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  List,
  MapPin,
  Search,
  UsersRound,
} from "lucide-react";

import {
  coachScheduleStatusFilters,
  type CoachScheduleRecord,
  type CoachScheduleStatus,
} from "@/lib/dashboard/coach-schedule-data";
import styles from "./coach-schedule-workspace.module.css";

type CoachScheduleWorkspaceProps = {
  records: CoachScheduleRecord[];
};

type ScheduleView = "week" | "day";

function tone(status: CoachScheduleStatus) {
  if (status === "Ready") return styles.ready;
  if (status === "Waitlist") return styles.waitlist;
  if (status === "Completed") return styles.completed;
  return styles.prep;
}

export function CoachScheduleWorkspace({
  records,
}: CoachScheduleWorkspaceProps) {
  const days = useMemo(
    () => [...new Set(records.map((record) => record.dayKey))],
    [records],
  );
  const [view, setView] = useState<ScheduleView>("week");
  const [day, setDay] = useState(days[0] ?? "All days");
  const [status, setStatus] = useState<"All" | CoachScheduleStatus>("All");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery =
        !query ||
        [record.title, record.location, record.note, record.rosterLabel]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesDay = view === "week" || record.dayKey === day;
      const matchesStatus = status === "All" || record.status === status;
      return matchesQuery && matchesDay && matchesStatus;
    });
  }, [day, deferredSearch, records, status, view]);

  const visibleDays = view === "week" ? days : [day];
  const readyCount = filtered.filter(
    (record) => record.status === "Ready",
  ).length;
  const totalAthletes = filtered.reduce((sum, record) => {
    const count = Number.parseInt(record.rosterLabel, 10);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);

  function focusDay(nextDay: string) {
    setDay(nextDay);
    setView("day");
  }

  function reset() {
    setSearch("");
    setStatus("All");
    setView("week");
    setDay(days[0] ?? "All days");
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Coach calendar</span>
          <h1>See the whole week.</h1>
          <p>
            Scan workload, athlete count and preparation state before the floor
            gets busy.
          </p>
        </div>
        <div className={styles.viewSwitch} aria-label="Schedule view">
          <button
            type="button"
            data-active={view === "week" || undefined}
            onClick={() => setView("week")}
          >
            <LayoutGrid size={16} /> Week
          </button>
          <button
            type="button"
            data-active={view === "day" || undefined}
            onClick={() => setView("day")}
          >
            <List size={16} /> Day
          </button>
        </div>
      </header>

      <section className={styles.stats} aria-label="Schedule summary">
        <article>
          <CalendarDays size={18} />
          <span>Sessions in view</span>
          <strong>{String(filtered.length).padStart(2, "0")}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Ready to run</span>
          <strong>{String(readyCount).padStart(2, "0")}</strong>
        </article>
        <article data-dark>
          <UsersRound size={18} />
          <span>Athlete load</span>
          <strong>{String(totalAthletes).padStart(2, "0")}</strong>
        </article>
      </section>

      <section className={styles.calendar}>
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={17} />
            <span className="sr-only">Search schedule</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search session, location or note"
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "All" | CoachScheduleStatus)
              }
            >
              {coachScheduleStatusFilters.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {(search || status !== "All" || view === "day") && (
            <button type="button" className={styles.reset} onClick={reset}>
              Reset view
            </button>
          )}
        </div>

        <nav className={styles.dayRail} aria-label="Schedule days">
          {days.map((item, index) => {
            const count = records.filter(
              (record) => record.dayKey === item,
            ).length;
            return (
              <button
                type="button"
                key={item}
                data-active={view === "day" && day === item ? true : undefined}
                onClick={() => focusDay(item)}
              >
                <span>{item.slice(0, 3)}</span>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <small>{count} blocks</small>
              </button>
            );
          })}
        </nav>

        <div
          className={styles.board}
          data-single={view === "day" || undefined}
          style={
            { "--day-count": Math.max(1, visibleDays.length) } as CSSProperties
          }
        >
          {visibleDays.map((visibleDay) => {
            const sessions = filtered.filter(
              (record) => record.dayKey === visibleDay,
            );
            return (
              <section key={visibleDay} className={styles.dayColumn}>
                <header>
                  <div>
                    <span>{visibleDay}</span>
                    <strong>{sessions[0]?.dateLabel ?? "Open day"}</strong>
                  </div>
                  <small>{sessions.length}</small>
                </header>
                <div>
                  {sessions.length ? (
                    sessions.map((session) => (
                      <article key={session.id} className={styles.session}>
                        <div className={styles.sessionTop}>
                          <time>
                            <Clock3 size={14} /> {session.timeRange}
                          </time>
                          <span
                            className={`${styles.status} ${tone(session.status)}`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <h2>{session.title}</h2>
                        <p>{session.note}</p>
                        <dl>
                          <div>
                            <dt>
                              <MapPin size={13} /> Location
                            </dt>
                            <dd>{session.location}</dd>
                          </div>
                          <div>
                            <dt>
                              <UsersRound size={13} /> Roster
                            </dt>
                            <dd>{session.rosterLabel}</dd>
                          </div>
                        </dl>
                        <footer>{session.sessionType}</footer>
                      </article>
                    ))
                  ) : (
                    <div className={styles.empty}>
                      <CalendarDays size={22} />
                      <strong>No sessions</strong>
                      <span>Clear day or filtered out.</span>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
