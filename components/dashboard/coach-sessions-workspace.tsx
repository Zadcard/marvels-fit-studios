"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Save,
  Search,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  assignCoachClientToSession,
  removeCoachClientFromSession,
} from "@/app/actions/coach-session-bookings";
import { saveCoachSessionNote } from "@/app/actions/coach-session-notes";
import {
  coachSessionStatusFilters,
  coachSessionTypeFilters,
  type CoachSessionRecord,
  type CoachSessionStatus,
  type CoachSessionType,
} from "@/lib/dashboard/coach-session-data";
import { paginateDashboardItems } from "@/lib/dashboard/pagination";
import styles from "./coach-sessions-workspace.module.css";

type Props = {
  records: CoachSessionRecord[];
  clientOptions: Array<{ id: string; fullName: string }>;
};
type Sort = "soonest" | "latest" | "status" | "type";

export function CoachSessionsWorkspace({ records, clientOptions }: Props) {
  const router = useRouter();
  const [rosterPending, startRoster] = useTransition();
  const [notePending, startNote] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [type, setType] = useState<"All" | CoachSessionType>("All");
  const [status, setStatus] = useState<"All" | CoachSessionStatus>("All");
  const [sort, setSort] = useState<Sort>("soonest");
  const [page, setPage] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState(
    records[0]?.id ?? "",
  );
  const [feedback, setFeedback] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(
    clientOptions[0]?.id ?? "",
  );
  const [noteDraft, setNoteDraft] = useState(records[0]?.noteValue ?? "");

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter((session) => {
      const matchesSearch =
        !query ||
        [session.title, session.location, session.focus, session.note]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return (
        matchesSearch &&
        (type === "All" || session.sessionType === type) &&
        (status === "All" || session.status === status)
      );
    });
  }, [deferredSearch, records, status, type]);
  const sorted = useMemo(
    () =>
      [...filtered].sort((left, right) => {
        const leftTiming = `${left.dayLabel} ${left.timeLabel}`;
        const rightTiming = `${right.dayLabel} ${right.timeLabel}`;
        if (sort === "latest") return rightTiming.localeCompare(leftTiming);
        if (sort === "status") return left.status.localeCompare(right.status);
        if (sort === "type")
          return left.sessionType.localeCompare(right.sessionType);
        return leftTiming.localeCompare(rightTiming);
      }),
    [filtered, sort],
  );
  const paginated = paginateDashboardItems(sorted, page);
  const selected =
    filtered.find((item) => item.id === selectedSessionId) ?? filtered[0];
  const availableClients = clientOptions.filter(
    (client) =>
      !selected?.bookings.some((booking) => booking.clientId === client.id),
  );
  const filteredClients = availableClients.filter((client) =>
    !clientSearch.trim()
      ? true
      : client.fullName
          .toLowerCase()
          .includes(clientSearch.trim().toLowerCase()),
  );
  const resolvedClientId = filteredClients.some(
    (client) => client.id === selectedClientId,
  )
    ? selectedClientId
    : (filteredClients[0]?.id ?? "");

  useEffect(() => setPage(1), [search, type, status, sort]);
  useEffect(() => {
    if (!filtered.some((item) => item.id === selectedSessionId))
      setSelectedSessionId(filtered[0]?.id ?? "");
  }, [filtered, selectedSessionId]);
  useEffect(
    () => setNoteDraft(selected?.noteValue ?? ""),
    [selected?.id, selected?.noteValue],
  );
  useEffect(() => {
    if (!filteredClients.length) setSelectedClientId("");
    else if (!filteredClients.some((item) => item.id === selectedClientId))
      setSelectedClientId(filteredClients[0]?.id ?? "");
  }, [filteredClients, selectedClientId]);

  function assignClient() {
    if (!selected || !resolvedClientId) return;
    setFeedback("");
    startRoster(async () => {
      try {
        await assignCoachClientToSession(selected.id, resolvedClientId);
        setFeedback("Member assigned to this session.");
        router.refresh();
      } catch (caught) {
        setFeedback(
          caught instanceof Error ? caught.message : "Could not assign member.",
        );
      }
    });
  }
  function removeClient(clientId: string) {
    if (!selected) return;
    setFeedback("");
    startRoster(async () => {
      try {
        await removeCoachClientFromSession(selected.id, clientId);
        setFeedback("Member removed from this session.");
        router.refresh();
      } catch (caught) {
        setFeedback(
          caught instanceof Error ? caught.message : "Could not remove member.",
        );
      }
    });
  }
  function saveNote() {
    if (!selected) return;
    setFeedback("");
    startNote(async () => {
      try {
        const result = await saveCoachSessionNote(selected.id, noteDraft);
        setNoteDraft(result.content);
        setFeedback("Session note saved.");
        router.refresh();
      } catch (caught) {
        setFeedback(
          caught instanceof Error
            ? caught.message
            : "Could not save session note.",
        );
      }
    });
  }

  const injuryFlags = records
    .flatMap((item) => item.bookings)
    .filter((item) => item.hasInjuryAlert).length;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Session command</span>
          <h1>Own the room before it starts.</h1>
          <p>
            Read the brief, protect every restriction, set the roster and leave
            a clean coaching record.
          </p>
        </div>
        <CalendarClock />
      </header>

      <section className={styles.scoreboard}>
        <article>
          <span>Assigned blocks</span>
          <strong>{String(records.length).padStart(2, "0")}</strong>
          <small>Your current session ledger</small>
        </article>
        <article>
          <span>Ready now</span>
          <strong>
            {String(
              records.filter((item) => item.status === "Ready").length,
            ).padStart(2, "0")}
          </strong>
          <small>Cleared to deliver</small>
        </article>
        <article data-alert={injuryFlags > 0 || undefined}>
          <span>Safety flags</span>
          <strong>{String(injuryFlags).padStart(2, "0")}</strong>
          <small>Across active rosters</small>
        </article>
        <article data-dark>
          <span>Members booked</span>
          <strong>
            {String(
              records.reduce((sum, item) => sum + item.bookings.length, 0),
            ).padStart(2, "0")}
          </strong>
          <small>Current participant count</small>
        </article>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search session, focus or location"
          />
        </label>
        <label>
          <span>Type</span>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "All" | CoachSessionType)
            }
          >
            {coachSessionTypeFilters.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "All" | CoachSessionStatus)
            }
          >
            {coachSessionStatusFilters.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
          >
            <option value="soonest">Soonest</option>
            <option value="latest">Latest</option>
            <option value="status">Status</option>
            <option value="type">Type</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setType("All");
            setStatus("All");
          }}
        >
          Reset
        </button>
      </section>

      {feedback ? (
        <p className={styles.feedback} role="status">
          {feedback}
        </p>
      ) : null}

      <section className={styles.layout}>
        <div className={styles.sessionList}>
          {paginated.items.length ? (
            paginated.items.map((session, index) => (
              <button
                key={session.id}
                type="button"
                data-selected={selected?.id === session.id || undefined}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <span className={styles.index}>
                  {String(
                    (paginated.page - 1) * paginated.pageSize + index + 1,
                  ).padStart(2, "0")}
                </span>
                <div className={styles.sessionIdentity}>
                  <span>
                    {session.sessionType} · {session.location}
                  </span>
                  <h2>{session.title}</h2>
                  <p>{session.focus}</p>
                </div>
                <div className={styles.timing}>
                  <strong>{session.timeLabel}</strong>
                  <span>{session.dayLabel}</span>
                </div>
                <div className={styles.roster}>
                  <UsersRound size={15} />
                  <span>{session.rosterLabel}</span>
                </div>
                <b data-status={session.status}>{session.status}</b>
              </button>
            ))
          ) : (
            <div className={styles.empty}>
              <ClipboardCheck size={26} />
              <strong>No sessions match this view</strong>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setType("All");
                  setStatus("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <footer className={styles.pagination}>
            <span>
              {paginated.totalItems
                ? `${paginated.startItem}–${paginated.endItem} of ${paginated.totalItems}`
                : "0 sessions"}
            </span>
            <div>
              <button
                type="button"
                aria-label="Previous page"
                disabled={paginated.page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft />
              </button>
              <strong>
                {paginated.page} / {paginated.pageCount}
              </strong>
              <button
                type="button"
                aria-label="Next page"
                disabled={paginated.page >= paginated.pageCount}
                onClick={() =>
                  setPage((value) => Math.min(paginated.pageCount, value + 1))
                }
              >
                <ChevronRight />
              </button>
            </div>
          </footer>
        </div>

        <aside className={styles.control}>
          {selected ? (
            <>
              <header>
                <div>
                  <span className={styles.kicker}>Selected block</span>
                  <h2>{selected.title}</h2>
                  <p>{selected.focus}</p>
                </div>
                <ClipboardCheck />
              </header>
              <section className={styles.meta}>
                <div>
                  <span>Timing</span>
                  <strong>{selected.timeLabel}</strong>
                  <small>{selected.dayLabel}</small>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{selected.sessionType}</strong>
                  <small>{selected.location}</small>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{selected.status}</strong>
                  <small>Current delivery state</small>
                </div>
                <div>
                  <span>Roster</span>
                  <strong>{selected.rosterLabel}</strong>
                  <small>{selected.bookings.length} assignments</small>
                </div>
              </section>
              <section className={styles.note}>
                <h3>Shared session note</h3>
                <p>Saved to the session and visible across role dashboards.</p>
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                />
                <button
                  type="button"
                  className="mv-btn mv-btn-primary"
                  onClick={saveNote}
                  disabled={notePending || !noteDraft.trim()}
                >
                  <Save size={15} />
                  {notePending ? "Saving…" : "Save note"}
                </button>
              </section>
              <section className={styles.assign}>
                <h3>Assign member</h3>
                <label>
                  <span>Search roster</span>
                  <input
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                    placeholder="Member name"
                  />
                </label>
                <label>
                  <span>Available member</span>
                  <select
                    value={resolvedClientId}
                    onChange={(event) =>
                      setSelectedClientId(event.target.value)
                    }
                    disabled={!filteredClients.length || rosterPending}
                  >
                    {filteredClients.length ? (
                      filteredClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName}
                        </option>
                      ))
                    ) : (
                      <option value="">
                        {availableClients.length
                          ? "No match"
                          : "No available members"}
                      </option>
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  className="mv-btn mv-btn-primary"
                  disabled={rosterPending || !resolvedClientId}
                  onClick={assignClient}
                >
                  <UserPlus size={15} />
                  {rosterPending ? "Assigning…" : "Assign member"}
                </button>
              </section>
              <section className={styles.currentRoster}>
                <header>
                  <div>
                    <h3>Session roster</h3>
                    <p>Attendance status is read-only for coaches.</p>
                  </div>
                  <span>{selected.bookings.length}</span>
                </header>
                {selected.bookings.length ? (
                  <ol>
                    {selected.bookings.map((booking) => (
                      <li
                        key={booking.clientId}
                        data-alert={booking.hasInjuryAlert || undefined}
                      >
                        <div>
                          <strong>{booking.fullName}</strong>
                          <span>{booking.status}</span>
                          {booking.hasInjuryAlert ? (
                            <p>
                              <AlertTriangle size={14} />
                              {booking.injuryStatus}
                              {booking.injuryNotes
                                ? ` · ${booking.injuryNotes}`
                                : ""}
                              {booking.restrictions
                                ? ` · Avoid: ${booking.restrictions}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          aria-label={`Unassign ${booking.fullName}`}
                          disabled={rosterPending}
                          onClick={() => removeClient(booking.clientId)}
                        >
                          <UserMinus />
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className={styles.rosterEmpty}>
                    No active bookings yet.
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className={styles.empty}>Choose a session block.</div>
          )}
        </aside>
      </section>
    </div>
  );
}
