"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  AdminAttendanceSession,
  AttendanceLabel,
} from "@/lib/dashboard/admin-attendance-record";
import {
  markAllAttendance,
  markAttendance,
} from "@/app/actions/admin-attendance";
import { formatPhoneNumber } from "@/lib/phone-format";
import {
  addStudioDays,
  getStudioDateKey,
  studioDateKeyAnchor,
} from "@/lib/time/studio-time";
import { EntityDialog, EntityForm, FormActions, FormField } from "@/components/ui/entity-form";
import styles from "./admin-attendance-workspace.module.css";

type Props = {
  sessions: AdminAttendanceSession[];
  dataSource: "demo" | "live";
  initialSessionId?: string;
  initialDateKey?: string;
};

type RosterStatus = AttendanceLabel;
type FilterTab = "all" | "pending" | "attended" | "trials" | "injuries" | "excused";

const exceptions = [
  { label: "Absent", status: "Absent" as const, icon: <X size={14} />, tone: "danger" as const },
];

const coachGradients: Record<string, string> = {
  "Ahmed Waheed": "red",
  "Youssef Abdelatif": "blue",
  "Mariam Soliman": "violet",
  "Khaled Habib": "amber",
  "Nour Rashad": "green",
};

const excusePresets = [
  "Medical / Doctor's note",
  "Work / Business travel",
  "Family emergency",
  "Weather / Severe traffic",
  "Prior scheduling notice",
];

function isAttendanceOpen(startsAtIso?: string) {
  if (!startsAtIso) return true;
  const startsAtTime = new Date(startsAtIso).getTime();
  const openTime = startsAtTime - 15 * 60 * 1000;
  return Date.now() >= openTime;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusGlyph(status: RosterStatus, isLate?: boolean, isExcused?: boolean) {
  if (isExcused) return <FileText size={16} />;
  if (status === "Attended" && isLate) return <Clock size={16} />;
  if (status === "Attended") return <Check size={16} />;
  if (status === "Absent") return <X size={16} />;
  if (status === "No-show") return "N";
  return "-";
}

function statusForWrite(status: RosterStatus) {
  if (status === "Attended") return "ATTENDED";
  if (status === "Absent") return "MISSED";
  if (status === "No-show") return "NO_SHOW";
  return "BOOKED";
}


const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarModal({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const todayKey = getStudioDateKey();
  const initialDate = selectedDate || todayKey;
  const [viewYear, setViewYear] = useState(() => Number(initialDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(initialDate.slice(5, 7)) - 1);

  const firstDay = new Date(Date.UTC(viewYear, viewMonth, 1));
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const startPad = firstDay.getUTCDay(); // 0=Sun

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  function pickDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onSelect(`${viewYear}-${mm}-${dd}`);
  }

  return (
    <div className={styles.calModalOverlay} onClick={onClose}>
      <div className={styles.calModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.calHeader}>
          <button type="button" onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <span>{monthLabel}</span>
          <button type="button" onClick={nextMonth} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
        <div className={styles.calGrid}>
          {WEEKDAYS.map((d) => <span key={d} className={styles.calWeekday}>{d}</span>)}
          {cells.map((day, i) => {
            if (!day) return <span key={`pad-${i}`} />;
            const mm = String(viewMonth + 1).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            const key = `${viewYear}-${mm}-${dd}`;
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                className={styles.calDay}
                data-today={isToday ? "true" : undefined}
                data-selected={isSelected ? "true" : undefined}
                onClick={() => pickDay(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className={styles.calFooter}>
          <button type="button" className={styles.calTodayBtn} onClick={() => { onSelect(todayKey); }}>Today</button>
          <button type="button" className={styles.calCloseBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function AdminAttendanceWorkspace({ sessions, dataSource, initialSessionId, initialDateKey }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedSession = initialSessionId ?? searchParams.get("session");
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedId, setSelectedId] = useState(
    () => (sessions.some((session) => session.id === requestedSession) ? requestedSession ?? "" : sessions[0]?.id ?? ""),
  );

  const [overrides, setOverrides] = useState<Record<string, RosterStatus>>({});
  const [lateCheckins, setLateCheckins] = useState<Record<string, boolean>>({});
  const [excuses, setExcuses] = useState<Record<string, string>>({});

  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, startTransition] = useTransition();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Excuse Dialog state
  const [excuseTarget, setExcuseTarget] = useState<{
    sessionId: string;
    clientId: string;
    fullName: string;
  } | null>(null);
  const [excuseInput, setExcuseInput] = useState("");

  const selected = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null,
    [selectedId, sessions],
  );

  useEffect(() => {
    if (requestedSession && sessions.some((session) => session.id === requestedSession)) {
      setSelectedId(requestedSession);
    }
  }, [requestedSession, sessions]);

  function chooseSession(id: string) {
    setSelectedId(id);
    setSearchQuery("");
    setActiveFilter("all");
    router.replace(`/admin/attendance?session=${encodeURIComponent(id)}`, { scroll: false });
  }

  const statusFor = (sessionId: string, clientId: string, initial: AttendanceLabel) => {
    const sessionObj = sessions.find((s) => s.id === sessionId);
    if (sessionObj?.startsAt && !isAttendanceOpen(sessionObj.startsAt)) {
      return "Booked";
    }
    return overrides[`${sessionId}:${clientId}`] ?? initial;
  };

  function mark(sessionId: string, clientId: string, status: RosterStatus, isLate = false) {
    const key = `${sessionId}:${clientId}`;
    const initialStatus =
      sessions
        .find((session) => session.id === sessionId)
        ?.attendees.find((attendee) => attendee.clientId === clientId)?.status ?? "Booked";

    const previousOverride = overrides[key];
    const currentStatus = previousOverride ?? initialStatus;

    // Toggle logic: clicking same status again resets to Booked
    const nextStatus = currentStatus === status && !isLate ? "Booked" : status;

    setSaveMessage("");
    setOverrides((current) => ({
      ...current,
      [key]: nextStatus,
    }));

    setLateCheckins((current) => ({
      ...current,
      [key]: nextStatus === "Attended" ? isLate : false,
    }));

    // Clear excuse if marking attended or reset
    if (nextStatus === "Attended" || nextStatus === "Booked") {
      setExcuses((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }

    if (dataSource !== "live") return;

    startTransition(async () => {
      try {
        await markAttendance(sessionId, clientId, statusForWrite(nextStatus));
        setSaveMessage(
          nextStatus === "Booked"
            ? "Check-in cleared."
            : isLate
              ? "Attended (Late) recorded."
              : "Attendance saved.",
        );
        router.refresh();
      } catch {
        setOverrides((current) => {
          const next = { ...current };
          if (previousOverride) next[key] = previousOverride;
          else delete next[key];
          return next;
        });
        setSaveMessage("Could not save attendance. Your previous status was restored.");
      }
    });
  }

  function handleSaveExcuse() {
    if (!excuseTarget) return;
    const key = `${excuseTarget.sessionId}:${excuseTarget.clientId}`;
    const note = excuseInput.trim() || "Excused absence";

    setExcuses((current) => ({
      ...current,
      [key]: note,
    }));

    // Mark as Absent in DB
    mark(excuseTarget.sessionId, excuseTarget.clientId, "Absent");

    setExcuseTarget(null);
    setExcuseInput("");
  }

  function markAllIn() {
    if (!selected) return;
    setSaveMessage("");
    const pending = selected.attendees.filter(
      (attendee) => statusFor(selected.id, attendee.clientId, attendee.status) === "Booked",
    );
    if (!pending.length) return;

    const previousOverrides = new Map(
      pending.map((attendee) => {
        const key = `${selected.id}:${attendee.clientId}`;
        return [key, overrides[key]] as const;
      }),
    );

    setOverrides((current) => {
      const next = { ...current };
      for (const attendee of pending) {
        const key = `${selected.id}:${attendee.clientId}`;
        next[key] = "Attended";
      }
      return next;
    });

    if (dataSource !== "live") return;

    startTransition(async () => {
      try {
        await markAllAttendance(
          selected.id,
          pending.map((attendee) => attendee.clientId),
          "ATTENDED",
        );
        setSaveMessage("All pending attendees were checked in.");
        router.refresh();
      } catch {
        setOverrides((current) => {
          const next = { ...current };
          for (const attendee of pending) {
            const key = `${selected.id}:${attendee.clientId}`;
            const previous = previousOverrides.get(key);
            if (previous) next[key] = previous;
            else delete next[key];
          }
          return next;
        });
        setSaveMessage("Could not save check-ins. The previous roster was restored.");
      }
    });
  }



  const totals = selected?.attendees.reduce(
    (summary, attendee) => {
      const key = `${selected.id}:${attendee.clientId}`;
      const status = statusFor(selected.id, attendee.clientId, attendee.status);
      const isExcused = !!excuses[key];

      if (status === "Attended") summary.attended += 1;
      else if (status === "Absent" || status === "No-show") summary.absent += 1;
      else summary.pending += 1;

      if (attendee.isTrial) summary.trials += 1;
      if (attendee.hasInjuryAlert) summary.injuries += 1;
      if (isExcused) summary.excused += 1;

      return summary;
    },
    { attended: 0, absent: 0, pending: 0, trials: 0, injuries: 0, excused: 0 },
  ) ?? { attended: 0, absent: 0, pending: 0, trials: 0, injuries: 0, excused: 0 };

  const totalCount = selected?.attendees.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((totals.attended / totalCount) * 100) : 0;

  // Filter & Search roster rows
  const filteredAttendees = (selected?.attendees ?? []).filter((attendee) => {
    const key = `${selected!.id}:${attendee.clientId}`;
    const status = statusFor(selected!.id, attendee.clientId, attendee.status);
    const isExcused = !!excuses[key];

    // Filter tab condition
    if (activeFilter === "pending" && status !== "Booked") return false;
    if (activeFilter === "attended" && status !== "Attended") return false;
    if (activeFilter === "trials" && !attendee.isTrial) return false;
    if (activeFilter === "injuries" && !attendee.hasInjuryAlert) return false;
    if (activeFilter === "excused" && !isExcused) return false;

    // Search query condition
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = attendee.fullName.toLowerCase().includes(query);
      const matchPhone = attendee.phone?.includes(query);
      const matchInjury = attendee.injuryNotes?.toLowerCase().includes(query) || attendee.injuryStatus?.toLowerCase().includes(query);
      const matchExcuse = excuses[key]?.toLowerCase().includes(query);
      return matchName || matchPhone || matchInjury || matchExcuse;
    }

    return true;
  });

  const todayKey = getStudioDateKey();
  const activeDateKey = initialDateKey || todayKey;

  function navigateToDate(dateKey: string) {
    router.replace(`/admin/attendance?date=${dateKey}`, { scroll: false });
  }

  return (
    <div className={styles.page}>
      {/* 1. Day Navigation Strip — always anchored to today ±3 */}
      <div className={styles.dateStrip} aria-label="Attendance dates">
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
          const key = addStudioDays(todayKey, offset);
          const dateObj = studioDateKeyAnchor(key);
          const isToday = key === todayKey;
          const isSelected = key === activeDateKey;

          return (
            <button
              type="button"
              key={key}
              data-active={isSelected ? "true" : undefined}
              data-today={isToday ? "true" : undefined}
              onClick={() => navigateToDate(key)}
            >
              <span>{isToday ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <strong>{dateObj.getUTCDate()}</strong>
              <small>{dateObj.toLocaleDateString("en-US", { month: "short" })}</small>
            </button>
          );
        })}

        {/* Calendar picker button */}
        <button
          type="button"
          className={styles.calendarPickerBtn}
          title="Pick any date"
          onClick={() => setShowCalendar(true)}
          aria-label="Jump to any date"
        >
          <Calendar size={16} />
        </button>

        {/* Active date badge — shown only when selected date is outside the ±3 strip */}
        {(() => {
          const isOutsideStrip = activeDateKey !== todayKey && (
            activeDateKey < addStudioDays(todayKey, -3) ||
            activeDateKey > addStudioDays(todayKey, 3)
          );
          if (!isOutsideStrip) return null;
          const activeDateObj = studioDateKeyAnchor(activeDateKey);
          return (
            <button
              type="button"
              className={styles.calActiveDateBadge}
              data-active="true"
              onClick={() => setShowCalendar(true)}
              title="Currently viewing this date — click to change"
            >
              <span>{activeDateObj.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <strong>{activeDateObj.getUTCDate()}</strong>
              <small>{activeDateObj.toLocaleDateString("en-US", { month: "short" })}</small>
            </button>
          );
        })()}
      </div>

      {showCalendar && (
        <CalendarModal
          selectedDate={activeDateKey}
          onSelect={(date) => { navigateToDate(date); setShowCalendar(false); }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* 2. Chronological Group Session Cards or Empty Day State */}
      {sessions.length === 0 ? (
        <div className={styles.emptyDayCard}>
          <AlertTriangle size={24} style={{ color: "var(--rl-warning)", flexShrink: 0 }} />
          <div>
            <h3>No sessions scheduled for this date</h3>
            <p>Select another date from the day strip above or view today's active sessions.</p>
          </div>
          <button
            type="button"
            className="mv-btn mv-btn-secondary"
            style={{ marginLeft: "auto" }}
            onClick={() => navigateToDate(todayKey)}
          >
            Back to Today →
          </button>
        </div>
      ) : (
        <>
          <div className={styles.sessionCardsGrid} aria-label="Group sessions for selected day">
            {sessions.map((session) => {
              const present = session.attendees.filter(
                (attendee) => statusFor(session.id, attendee.clientId, attendee.status) === "Attended",
              ).length;
              const isLocked = session.startsAt ? !isAttendanceOpen(session.startsAt) : false;

              return (
                <button
                  type="button"
                  key={session.id}
                  className={styles.sessionCard}
                  data-active={selected?.id === session.id || undefined}
                  onClick={() => chooseSession(session.id)}
                >
                  <div className={styles.sessionCardHeader}>
                    <span className={styles.sessionTime}>{session.timeLabel}</span>
                    <span className={styles.sessionBadge} data-locked={isLocked || undefined}>
                      {isLocked ? "Upcoming" : `${present}/${session.attendees.length} in`}
                    </span>
                  </div>
                  <strong className={styles.sessionTitle}>{session.title}</strong>
                  <span className={styles.sessionCoach}>{session.coachName}</span>
                </button>
              );
            })}
          </div>

      <section className={styles.rosterPanel}>
        {/* Roster Header */}
        <header>
          <div className={styles.sessionInfo}>
            <div>
              <h2>{selected?.title}</h2>
              <span>{selected?.sessionType}</span>
            </div>
            <p>
              <i data-tone={coachGradients[selected?.coachName ?? ""] ?? "red"}>
                {initials(selected?.coachName ?? "Coach")}
              </i>
              {selected?.coachName} &middot; {selected?.timeLabel}
            </p>
          </div>
          <div className={styles.checkInTotal}>
            <strong>
              <b>{totals.attended}</b>/{selected?.attendees.length}
            </strong>
            <span>Checked in ({progressPercent}%)</span>
          </div>
          <button
            className={styles.markAll}
            type="button"
            onClick={markAllIn}
            disabled={isSaving || !isAttendanceOpen(selected?.startsAt)}
          >
            <Check size={15} /> {isSaving ? "Saving…" : "Mark all in"}
          </button>
        </header>

        {/* Attendance Lock Banner if session is in the future */}
        {selected && !isAttendanceOpen(selected.startsAt) ? (
          <div className={styles.lockedBanner}>
            <Clock size={16} />
            <span>Attendance marking opens 15 minutes before session start time ({selected.timeLabel}).</span>
          </div>
        ) : null}

        {/* Visual Attendance Progress Bar */}
        <div className={styles.progressBarTrack} title={`${progressPercent}% checked in`}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Search & Filter Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search client by name or phone..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search client"
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <div className={styles.filterPills} role="tablist" aria-label="Roster filters">
            <button
              type="button"
              role="tab"
              data-active={activeFilter === "all" || undefined}
              onClick={() => setActiveFilter("all")}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              role="tab"
              data-active={activeFilter === "pending" || undefined}
              onClick={() => setActiveFilter("pending")}
            >
              Pending ({totals.pending})
            </button>
            <button
              type="button"
              role="tab"
              data-active={activeFilter === "attended" || undefined}
              onClick={() => setActiveFilter("attended")}
            >
              Attended ({totals.attended})
            </button>
            <button
              type="button"
              role="tab"
              data-active={activeFilter === "trials" || undefined}
              onClick={() => setActiveFilter("trials")}
            >
              Leads ({totals.trials})
            </button>
            <button
              type="button"
              role="tab"
              data-active={activeFilter === "injuries" || undefined}
              onClick={() => setActiveFilter("injuries")}
            >
              Injury Flags ({totals.injuries})
            </button>
            {totals.excused > 0 ? (
              <button
                type="button"
                role="tab"
                data-active={activeFilter === "excused" || undefined}
                onClick={() => setActiveFilter("excused")}
              >
                Excused ({totals.excused})
              </button>
            ) : null}
          </div>
        </div>

        {/* Clean, Left-Aligned Roster Table View */}
        <div className={styles.rosterTable}>
          <div className={styles.rosterHead}>
            <span>State</span>
            <span>Client</span>
            <span>Phone</span>
            <span>WhatsApp</span>
            <span>Actions</span>
          </div>

          {filteredAttendees.map((attendee) => {
            const key = `${selected!.id}:${attendee.clientId}`;
            const currentLabel = statusFor(selected!.id, attendee.clientId, attendee.status);
            const isLate = !!lateCheckins[key];
            const excuseNote = excuses[key];
            const formattedPhone = formatPhoneNumber(attendee.phone);

            return (
              <article
                className={styles.rosterRow}
                data-status={currentLabel}
                data-late={isLate || undefined}
                data-injury={attendee.hasInjuryAlert || undefined}
                data-excused={!!excuseNote || undefined}
                key={attendee.clientId}
                onClick={() => mark(selected!.id, attendee.clientId, "Attended")}
                tabIndex={0}
                role="button"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    mark(selected!.id, attendee.clientId, "Attended");
                  }
                }}
              >
                {/* 1. State Glyph Cell */}
                <div className={styles.stateCell}>
                  <span
                    className={styles.state}
                    data-status={currentLabel}
                    data-late={isLate || undefined}
                    data-excused={!!excuseNote || undefined}
                  >
                    {statusGlyph(currentLabel, isLate, !!excuseNote)}
                  </span>
                </div>

                {/* 2. Client Cell (Name, Member/Lead Badge, Injury Warning Badge & Notes) */}
                <div className={styles.clientCell}>
                  <div className={styles.avatar}>{initials(attendee.fullName)}</div>
                  <div className={styles.nameCol}>
                    <div className={styles.nameLine}>
                      <strong className={styles.clientName}>{attendee.fullName}</strong>
                      {attendee.isTrial ? (
                        <small className={styles.trialBadge}>Lead</small>
                      ) : (
                        <small className={styles.memberBadge}>Member</small>
                      )}
                      {attendee.hasInjuryAlert ? (
                        <small className={styles.injuryBadge} title={attendee.injuryNotes || attendee.injuryStatus}>
                          <AlertTriangle size={10} /> Injury
                        </small>
                      ) : null}
                    </div>

                    {/* Injury Details Warning Line */}
                    {attendee.hasInjuryAlert ? (
                      <span className={styles.injuryTextUnderName}>
                        <AlertTriangle size={11} /> Injury: {attendee.injuryNotes || attendee.injuryStatus || "Active Injury Flag"}
                      </span>
                    ) : null}

                    {/* Excuse Details Line */}
                    {excuseNote ? (
                      <span className={styles.excusedTextUnderName}>
                        <FileText size={11} /> Excused: {excuseNote}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 3. Phone Number Cell */}
                <div className={styles.phoneCell}>
                  <span className={styles.phoneText}>{formattedPhone}</span>
                </div>

                {/* 4. WhatsApp Cell */}
                <div className={styles.waCell}>
                  {attendee.phone && !attendee.phone.includes("No phone") ? (
                    <a
                      href={`https://wa.me/${attendee.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.waLink}
                      onClick={(e) => e.stopPropagation()}
                      title="Send WhatsApp message"
                    >
                      <MessageCircle size={13} /> Send WhatsApp
                    </a>
                  ) : (
                    <span className={styles.noPhoneText}>No phone</span>
                  )}
                </div>

                {/* 5. Action Controls Cell (Attended, Late, Absent, Excused) */}
                <div className={styles.rowActions} onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.attendedBtn}
                    data-active={currentLabel === "Attended" && !isLate || undefined}
                    onClick={() => mark(selected!.id, attendee.clientId, "Attended", false)}
                    aria-label={`Mark attended: ${attendee.fullName}`}
                    title="Attended / On Time (Green)"
                  >
                    <Check size={13} />
                    <span>Attended</span>
                  </button>

                  <button
                    type="button"
                    className={styles.lateBtn}
                    data-active={currentLabel === "Attended" && isLate || undefined}
                    onClick={() => mark(selected!.id, attendee.clientId, "Attended", true)}
                    aria-label={`Mark late: ${attendee.fullName}`}
                    title="Attended Late (Yellow)"
                  >
                    <Clock size={13} />
                    <span>Late</span>
                  </button>

                  {exceptions.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      data-tone={action.tone}
                      data-active={currentLabel === action.status && !excuseNote || undefined}
                      onClick={() => mark(selected!.id, attendee.clientId, action.status)}
                      aria-label={`${action.label}: ${attendee.fullName}`}
                      title="Absent (Red)"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    className={styles.excusedBtn}
                    data-active={!!excuseNote || undefined}
                    onClick={() => {
                      setExcuseTarget({
                        sessionId: selected!.id,
                        clientId: attendee.clientId,
                        fullName: attendee.fullName,
                      });
                      setExcuseInput(excuses[key] ?? "");
                    }}
                    aria-label={`Record excuse: ${attendee.fullName}`}
                    title="Excused (Blue)"
                  >
                    <FileText size={13} />
                    <span>Excused</span>
                  </button>
                </div>
              </article>
            );
          })}

          {!filteredAttendees.length ? (
            <p className={styles.noFilterResults}>No clients match the selected filter or search query.</p>
          ) : null}
        </div>
      </section>
      </>
      )}

      {/* Record Excuse Modal Dialog */}
      {excuseTarget ? (
        <EntityDialog
          open={!!excuseTarget}
          onOpenChange={(open) => !open && setExcuseTarget(null)}
          title={`Record Excuse: ${excuseTarget.fullName}`}
          description="Save an absence excuse for this client."
          closeLabel="Close excuse entry"
          size="small"
        >
          <EntityForm
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveExcuse();
            }}
          >
            <FormField label="Quick excuse presets" full>
              <div className={styles.presetChips}>
                {excusePresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    className={styles.presetChip}
                    data-active={excuseInput === preset || undefined}
                    onClick={() => setExcuseInput(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Excuse Note / Details" required full>
              <input
                type="text"
                value={excuseInput}
                onChange={(event) => setExcuseInput(event.target.value)}
                placeholder="Enter excuse details..."
                maxLength={200}
                required
              />
            </FormField>

            <FormActions
              onCancel={() => setExcuseTarget(null)}
              submitLabel="Save Excuse Note"
            />
          </EntityForm>
        </EntityDialog>
      ) : null}
    </div>
  );
}
