"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";

import {
  clientSessionPeriodFilters,
  clientSessionTypeFilters,
  type ClientSessionPeriod,
  type ClientSessionRecord,
  type ClientSessionStatus,
  type ClientSessionType,
} from "@/lib/dashboard/client-dashboard-data";
import styles from "./client-sessions-workspace.module.css";

type ClientSessionsWorkspaceProps = { records: ClientSessionRecord[] };

function tone(status: ClientSessionStatus) {
  if (status === "Check-in ready" || status === "You attended")
    return styles.success;
  if (status === "You missed" || status === "Waitlist") return styles.warning;
  if (status === "Cancelled") return styles.neutral;
  return styles.booked;
}

function statusCopy(status: ClientSessionStatus) {
  if (status === "You attended") return "Attendance confirmed by the studio.";
  if (status === "You missed")
    return "The studio recorded this session as missed.";
  if (status === "Cancelled")
    return "This booking was cancelled and will not count toward attendance.";
  if (status === "Waitlist")
    return "You are currently waiting for a place in this session.";
  if (status === "Check-in ready")
    return "Your arrival window is open. You are ready to check in.";
  return "Your place is confirmed. Any updates will appear here.";
}

export function ClientSessionsWorkspace({
  records,
}: ClientSessionsWorkspaceProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [period, setPeriod] = useState<"All" | ClientSessionPeriod>("All");
  const [type, setType] = useState<"All" | ClientSessionType>("All");
  const [selected, setSelected] = useState<ClientSessionRecord | null>(null);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((record) => {
      const matchesQuery =
        !query ||
        [record.title, record.location, record.coachName, record.note]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return (
        matchesQuery &&
        (period === "All" || record.period === period) &&
        (type === "All" || record.sessionType === type)
      );
    });
  }, [deferredSearch, period, records, type]);

  const upcoming = records.filter(
    (record) => record.period === "Upcoming",
  ).length;
  const attended = records.filter(
    (record) => record.status === "You attended",
  ).length;
  const ready = records.filter(
    (record) => record.status === "Check-in ready",
  ).length;

  function reset() {
    setSearch("");
    setPeriod("All");
    setType("All");
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>My sessions</span>
          <h1>Know every session.</h1>
          <p>
            Upcoming training, attendance history and the details you need
            before you arrive.
          </p>
        </div>
      </header>
      <section className={styles.scoreboard} aria-label="Session summary">
        <article>
          <CalendarClock size={18} />
          <span>Upcoming</span>
          <strong>{String(upcoming).padStart(2, "0")}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Attended</span>
          <strong>{String(attended).padStart(2, "0")}</strong>
        </article>
        <article data-dark>
          <Clock3 size={18} />
          <span>Check-in ready</span>
          <strong>{String(ready).padStart(2, "0")}</strong>
        </article>
      </section>
      <section className={styles.ledger}>
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={17} />
            <span className="sr-only">Search sessions</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search session, coach or location"
            />
          </label>
          <label>
            <span>Period</span>
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as "All" | ClientSessionPeriod)
              }
            >
              {clientSessionPeriodFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as "All" | ClientSessionType)
              }
            >
              {clientSessionTypeFilters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {search || period !== "All" || type !== "All" ? (
            <button type="button" onClick={reset}>
              Reset
            </button>
          ) : null}
        </div>
        <div className={styles.ledgerHead}>
          <span>{filtered.length} sessions in view</span>
          <strong>Tap any row for the full readout</strong>
        </div>
        {filtered.length ? (
          <div className={styles.sessionList}>
            {filtered.map((session, index) => (
              <button
                type="button"
                key={session.id}
                onClick={() => setSelected(session)}
              >
                <span className={styles.sequence}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={styles.identity}>
                  <span className={`${styles.status} ${tone(session.status)}`}>
                    {session.status}
                  </span>
                  <strong>{session.title}</strong>
                  <small>
                    {session.sessionType} · {session.period}
                  </small>
                </div>
                <time>
                  <Clock3 size={14} />
                  {session.dayLabel}
                  <small>{session.timeLabel}</small>
                </time>
                <div className={styles.location}>
                  <MapPin size={14} />
                  <strong>{session.location}</strong>
                  <small>{session.coachName}</small>
                </div>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <CalendarClock size={26} />
            <strong>No sessions match</strong>
            <span>Reset the filters to see your full history.</span>
            <button type="button" onClick={reset}>
              Clear filters
            </button>
          </div>
        )}
      </section>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog}>
            <Dialog.Title>{selected?.title ?? "Session details"}</Dialog.Title>
            <Dialog.Description>
              {selected
                ? `${selected.dayLabel}, ${selected.timeLabel}`
                : "Full session readout"}
            </Dialog.Description>
            <Dialog.Close
              className={styles.close}
              aria-label="Close session details"
            >
              <X size={18} />
            </Dialog.Close>
            {selected ? (
              <>
                <div className={styles.dialogStatus}>
                  <span className={`${styles.status} ${tone(selected.status)}`}>
                    {selected.status}
                  </span>
                  <p>{statusCopy(selected.status)}</p>
                </div>
                <dl>
                  <div>
                    <dt>
                      <Clock3 size={14} />
                      When
                    </dt>
                    <dd>
                      {selected.dayLabel}
                      <small>{selected.timeLabel}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <MapPin size={14} />
                      Location
                    </dt>
                    <dd>
                      {selected.location}
                      <small>{selected.sessionType}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <UserRound size={14} />
                      Coach
                    </dt>
                    <dd>
                      {selected.coachName}
                      <small>{selected.period}</small>
                    </dd>
                  </div>
                </dl>
                <article>
                  <span>Session note</span>
                  <p>{selected.note}</p>
                </article>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
