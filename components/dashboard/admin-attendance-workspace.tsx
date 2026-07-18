"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CalendarCheck, Check, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  AdminAttendanceSession,
  AttendanceLabel,
} from "@/lib/dashboard/admin-attendance-record";
import {
  markAllAttendance,
  markAttendance,
} from "@/app/actions/admin-attendance";
import styles from "./admin-attendance-workspace.module.css";

type Props = {
  sessions: AdminAttendanceSession[];
  dataSource: "demo" | "live";
};
type RosterStatus = AttendanceLabel;

const exceptions = [
  { label: "Absent", status: "Absent" as const, icon: <X size={15} />, tone: "warning" },
  { label: "No-show", status: "No-show" as const, icon: "N", tone: "danger" },
];

const coachGradients: Record<string, string> = {
  "Ahmed Waheed": "red",
  "Youssef Abdelatif": "blue",
  "Mariam Soliman": "violet",
  "Khaled Habib": "amber",
  "Nour Rashad": "green",
};

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function statusGlyph(status: RosterStatus) {
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

export function AdminAttendanceWorkspace({ sessions, dataSource }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedSession = searchParams.get("session");
  const [selectedId, setSelectedId] = useState(() => sessions.some((session) => session.id === requestedSession) ? requestedSession ?? "" : sessions[0]?.id ?? "");
  const [overrides, setOverrides] = useState<Record<string, RosterStatus>>({});
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, startTransition] = useTransition();
  const selected = useMemo(
    () => sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null,
    [selectedId, sessions],
  );

  useEffect(() => {
    if (requestedSession && sessions.some((session) => session.id === requestedSession)) setSelectedId(requestedSession);
  }, [requestedSession, sessions]);

  function chooseSession(id: string) {
    setSelectedId(id);
    router.replace(`/admin/attendance?session=${encodeURIComponent(id)}`, { scroll: false });
  }

  const statusFor = (sessionId: string, clientId: string, initial: AttendanceLabel) =>
    overrides[`${sessionId}:${clientId}`] ?? initial;

  function mark(sessionId: string, clientId: string, status: RosterStatus) {
    const key = `${sessionId}:${clientId}`;
    const initialStatus = sessions
      .find((session) => session.id === sessionId)
      ?.attendees.find((attendee) => attendee.clientId === clientId)?.status ?? "Booked";
    const previousOverride = overrides[key];
    const currentStatus = previousOverride ?? initialStatus;
    const nextStatus = currentStatus === status ? "Booked" : status;
    setSaveMessage("");
    setOverrides((current) => ({
      ...current,
      [key]: nextStatus,
    }));

    if (dataSource !== "live") return;

    startTransition(async () => {
      try {
        await markAttendance(sessionId, clientId, statusForWrite(nextStatus));
        setSaveMessage(nextStatus === "Booked" ? "Check-in cleared." : "Attendance saved.");
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

  if (!sessions.length) {
    return <div className={styles.empty}><CalendarCheck size={30} /><h2>No sessions today</h2><p>Today&apos;s rosters appear here for fast attendance.</p></div>;
  }

  const totals = selected?.attendees.reduce(
    (summary, attendee) => {
      const status = statusFor(selected.id, attendee.clientId, attendee.status);
      if (status === "Attended") summary.attended += 1;
      else if (status === "Absent" || status === "No-show") summary.absent += 1;
      else summary.pending += 1;
      return summary;
    },
    { attended: 0, absent: 0, pending: 0 },
  ) ?? { attended: 0, absent: 0, pending: 0 };

  return <div className={styles.page}>
    <div className={styles.sessionTabs} aria-label="Today sessions">
      {sessions.map((session) => {
        const present = session.attendees.filter((attendee) => statusFor(session.id, attendee.clientId, attendee.status) === "Attended").length;
        return <button type="button" key={session.id} data-active={selected?.id === session.id || undefined} onClick={() => chooseSession(session.id)}>
          <time>{session.timeLabel}</time><i aria-hidden="true" /><span><strong>{session.title}</strong><small>{present}/{session.attendees.length} in</small></span>
        </button>;
      })}
    </div>

    <section className={styles.rosterPanel}>
      <header>
        <div className={styles.sessionInfo}>
          <div><h2>{selected?.title}</h2><span>{selected?.sessionType}</span></div>
          <p><i data-tone={coachGradients[selected?.coachName ?? ""] ?? "red"}>{initials(selected?.coachName ?? "Coach")}</i>{selected?.coachName} &middot; {selected?.timeLabel}</p>
        </div>
        <div className={styles.checkInTotal}><strong><b>{totals.attended}</b>/{selected?.attendees.length}</strong><span>Checked in</span></div>
        <button className={styles.markAll} type="button" onClick={markAllIn} disabled={isSaving}><Check size={15} /> {isSaving ? "Saving…" : "Mark all in"}</button>
      </header>

      <div className={styles.hint}>Tap a row to check in &middot; use the flags for exceptions{dataSource === "demo" ? " · Demo roster" : ""}</div>
      {saveMessage ? <p className={styles.hint} role="status">{saveMessage}</p> : null}

      <div className={styles.rows}>{selected?.attendees.map((attendee) => {
        const currentLabel = statusFor(selected.id, attendee.clientId, attendee.status);
        return <article data-status={currentLabel} key={attendee.clientId} onClick={() => mark(selected.id, attendee.clientId, "Attended")} tabIndex={0} role="button" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); mark(selected.id, attendee.clientId, "Attended"); } }}>
          <span className={styles.state} data-status={currentLabel}>{statusGlyph(currentLabel)}</span>
          <div className={styles.who}><div className={styles.nameLine}><strong>{attendee.fullName}</strong>{attendee.hasInjuryAlert ? <small className={styles.injuryBadge}><AlertTriangle size={11} /> {attendee.injuryNotes}</small> : null}{attendee.isTrial ? <small className={styles.trialBadge}>Trial</small> : null}</div><span>{attendee.isTrial ? "Trial client" : "Member"}</span></div>
          <div className={styles.actions} onClick={(event) => event.stopPropagation()}>{exceptions.map((action) => <button key={action.status} type="button" data-tone={action.tone} data-active={currentLabel === action.status || undefined} onClick={() => mark(selected.id, attendee.clientId, action.status)} aria-label={`${action.label}: ${attendee.fullName}`} title={action.label}>{action.icon}</button>)}</div>
        </article>;
      })}</div>

      <footer><div className={styles.summary}><span data-tone="success">● {totals.attended} in</span><span data-tone="danger">● {totals.absent} absent</span><span>● {totals.pending} pending</span></div></footer>
    </section>
  </div>;
}
