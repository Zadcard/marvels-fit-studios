"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ClipboardCheck } from "lucide-react";

import { markAttendance } from "@/app/actions/admin-attendance";
import {
  attendanceActions,
  type AdminAttendanceSession,
  type AttendanceActionStatus,
  type AttendanceLabel,
} from "@/lib/dashboard/admin-attendance-record";
import styles from "./admin-attendance-workspace.module.css";

type Props = {
  sessions: AdminAttendanceSession[];
};

// The label a given action button maps to once applied, so the row reflects the
// new state immediately without waiting for a full refresh.
const ACTION_TO_LABEL: Record<AttendanceActionStatus, AttendanceLabel> = {
  ATTENDED: "Attended",
  MISSED: "Absent",
  NO_SHOW: "No-show",
  RESCHEDULED: "Rescheduled",
  CANCELED: "Cancelled",
};

export function AdminAttendanceWorkspace({ sessions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [overrides, setOverrides] = useState<Record<string, AttendanceLabel>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  function mark(
    sessionId: string,
    clientId: string,
    status: AttendanceActionStatus,
  ) {
    const key = `${sessionId}:${clientId}`;
    setError("");
    setPendingKey(key);
    startTransition(async () => {
      try {
        await markAttendance(sessionId, clientId, status);
        setOverrides((current) => ({ ...current, [key]: ACTION_TO_LABEL[status] }));
        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not record attendance.",
        );
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <div className={styles.page} aria-busy={isPending}>
      <header className={styles.header}>
        <span className={styles.kicker}><ClipboardCheck size={14} /> Today&apos;s attendance</span>
        <h1>Mark the room.</h1>
        <p>Every session happening today, in order. Tap a status for each person — injuries and trials are flagged.</p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </header>

      {sessions.length ? (
        <div className={styles.sessions}>
          {sessions.map((session) => (
            <section className={styles.session} key={session.id}>
              <div className={styles.sessionHead}>
                <span className={styles.time}>{session.timeLabel}</span>
                <div>
                  <h2>{session.title}</h2>
                  <span className={styles.sub}>{session.coachName} · {session.location}</span>
                </div>
                <span className={styles.tag}>{session.sessionType}</span>
                {session.trainingCategory ? <span className={styles.tag}>{session.trainingCategory}</span> : null}
              </div>
              <div className={styles.rows}>
                {session.attendees.length ? session.attendees.map((attendee) => {
                  const key = `${session.id}:${attendee.clientId}`;
                  const currentLabel = overrides[key] ?? attendee.status;
                  const isSet = currentLabel !== "Booked" && currentLabel !== "Waitlisted";
                  const rowPending = pendingKey === key && isPending;
                  return (
                    <div className={styles.row} key={attendee.clientId}>
                      <div className={styles.who}>
                        <strong>{attendee.fullName}</strong>
                        <div className={styles.flags}>
                          {attendee.hasInjuryAlert ? <span className={styles.flag} data-kind="injury" title={attendee.injuryNotes || undefined}>⚠ {attendee.injuryStatus}</span> : null}
                          {attendee.isTrial ? <span className={styles.flag} data-kind="trial">Trial</span> : null}
                        </div>
                      </div>
                      <span className={styles.current} data-set={isSet}>{currentLabel}</span>
                      <div className={styles.actions}>
                        {attendanceActions.map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            data-tone={action.tone}
                            data-active={currentLabel === ACTION_TO_LABEL[action.status]}
                            disabled={rowPending}
                            onClick={() => mark(session.id, attendee.clientId, action.status)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }) : <p className={styles.emptyRow}>No one is booked into this session yet.</p>}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <CalendarCheck size={30} />
          <h2>No sessions today</h2>
          <p>When today has scheduled sessions, their rosters appear here for fast attendance.</p>
        </div>
      )}
    </div>
  );
}
