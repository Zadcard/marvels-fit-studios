"use client";

import { Calendar, CalendarCheck, Check, Clock, FileText, X } from "lucide-react";
import type { AdminClientAttendanceRecord } from "@/lib/dashboard/admin-dashboard-data";
import styles from "./client-attendance-history.module.css";

export type ClientAttendanceHistoryProps = {
  clientName: string;
  history: AdminClientAttendanceRecord[];
};

export function ClientAttendanceHistory({ clientName, history }: ClientAttendanceHistoryProps) {
  return (
    <section className={styles.section}>
      {history.length === 0 ? (
        <div className={styles.emptyState}>
          <CalendarCheck size={16} />
          <span>No attendance history recorded for {clientName} yet.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {history.map((record) => {
            const isAttended = record.status === "ATTENDED";
            const isLate = record.status === "LATE";
            const isMissed = record.status === "MISSED" || record.status === "NO_SHOW";
            const isExcused = record.status === "EXCUSED";

            return (
              <article key={record.id} className={styles.card}>
                <div className={styles.mainInfo}>
                  <div className={styles.titleRow}>
                    <strong className={styles.sessionTitle}>{record.sessionTitle}</strong>
                    <span className={styles.typeBadge}>{record.sessionType}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span>{record.dateLabel} · {record.timeLabel}</span>
                    <span>• Coach {record.coachName}</span>
                  </div>
                </div>

                <div className={styles.badgeCol}>
                  {isAttended ? (
                    <span className={styles.badgeAttended}>
                      <Check size={12} /> Attended
                    </span>
                  ) : isLate ? (
                    <span className={styles.badgeLate}>
                      <Clock size={12} /> Late
                    </span>
                  ) : isMissed ? (
                    <span className={styles.badgeMissed}>
                      <X size={12} /> Missed
                    </span>
                  ) : isExcused ? (
                    <span className={styles.badgeExcused}>
                      <FileText size={12} /> Excused
                    </span>
                  ) : (
                    <span className={styles.badgeBooked}>
                      <Calendar size={12} /> Booked
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
