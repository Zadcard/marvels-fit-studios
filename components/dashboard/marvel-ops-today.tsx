"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  CircleDollarSign,
  Clock,
  ExternalLink,
  MessageCircle,
  Radio,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

import type {
  AdminTodayCoach,
  AdminTodayOperations,
  AdminTodayPayment,
  AdminTodayRenewal,
  AdminTodaySession,
  AdminTodayTrial,
} from "@/lib/dashboard/admin-today-operations";
import { formatPhoneNumber } from "@/lib/phone-format";
import { STUDIO_TIME_ZONE } from "@/lib/time/studio-time";
import { EntityDialog } from "@/components/ui/entity-form";
import styles from "./marvel-ops-today.module.css";

const tones = ["red", "green", "violet", "blue", "amber"] as const;

export function MarvelOpsToday({ data }: { data: AdminTodayOperations }) {
  const router = useRouter();

  // Selection states for in-place detail modals
  const [selectedSession, setSelectedSession] = useState<AdminTodaySession | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<AdminTodayCoach | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<AdminTodayTrial | null>(null);
  const [selectedRenewal, setSelectedRenewal] = useState<AdminTodayRenewal | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<AdminTodayPayment | null>(null);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const liveCoach = data.coaches.find((coach) => coach.status === "On floor");
  const urgentCount = data.trials.length + data.renewals.length;

  return (
    <div className={styles.page}>
      {/* Studio Live Pulse Hero Banner */}
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.heroBadge}>
            <span className={styles.liveDot} /> STUDIO LIVE PULSE
          </span>
          <h1>Today&apos;s Operations</h1>
          <p className={styles.heroDate}>{dateLabel}</p>
        </div>
        <div className={styles.heroStatus}>
          {liveCoach ? (
            <div className={styles.liveCoachPill}>
              <Radio size={15} className={styles.pulseIcon} />
              <div>
                <strong>{liveCoach.fullName}</strong>
                <small>{liveCoach.detail}</small>
              </div>
            </div>
          ) : (
            <div className={styles.idleCoachPill}>
              <Clock size={15} />
              <span>No live session on floor right now</span>
            </div>
          )}
        </div>
      </header>

      {/* Key Metrics Executive Ribbon */}
      <section className={styles.metrics} aria-label="Today at a glance">
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <Radio size={13} /> SESSIONS TODAY
          </span>
          <strong className={styles.metricValue}>
            {data.sessions.length}
            {data.liveCount > 0 ? <small className={styles.liveTag}>{data.liveCount} LIVE</small> : null}
          </strong>
          <p className={styles.metricSub}>
            {data.sessions.length === 1 ? "1 session scheduled" : `${data.sessions.length} sessions scheduled`}
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <Users size={13} /> EXPECTED CLIENTS
          </span>
          <strong className={styles.metricValue}>{data.expectedClients}</strong>
          <p className={styles.metricSub}>Total checked-in & booked</p>
        </article>

        <article className={styles.metricCard} data-tone={urgentCount > 0 ? "warning" : "success"}>
          <span className={styles.metricLabel}>
            <Zap size={13} /> PRIORITY ACTIONS
          </span>
          <strong className={styles.metricValue}>{urgentCount}</strong>
          <p className={styles.metricSub}>
            {data.trials.length} trials · {data.renewals.length} renewals
          </p>
        </article>

        <article className={styles.metricCard} data-tone="success">
          <span className={styles.metricLabel}>
            <CircleDollarSign size={13} /> CASH TODAY
          </span>
          <strong className={styles.metricValue}>{data.cashTodayLabel}</strong>
          <p className={styles.metricSub}>
            {data.cashTodayCount} {data.cashTodayCount === 1 ? "entry" : "entries"} recorded
          </p>
        </article>
      </section>

      {/* Main 2-Column Command Center */}
      <div className={styles.grid}>
        {/* Left Primary Column: Live Schedule & Coaches */}
        <div className={styles.primary}>
          {/* Today's Sessions Panel */}
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelTag}>OPERATIONS</span>
                <h2>Today&apos;s Sessions</h2>
              </div>
              <button
                type="button"
                className={styles.headerBtn}
                onClick={() => router.push("/admin/schedule")}
              >
                Full schedule <ArrowRight size={14} />
              </button>
            </header>

            <div className={styles.sessionList}>
              {data.sessions.map((session, index) => (
                <button
                  type="button"
                  key={session.id}
                  className={styles.sessionItem}
                  data-live={session.isLive || undefined}
                  onClick={() => setSelectedSession(session)}
                >
                  <time className={styles.sessionTime}>
                    <strong>{session.timeLabel}</strong>
                    <small className={session.isLive ? styles.liveSmall : undefined}>
                      {session.isLive ? "LIVE NOW" : session.durationLabel}
                    </small>
                  </time>
                  <span className={styles.sessionTitle}>
                    <i data-tone={tones[index % tones.length]}>{session.coachInitials}</i>
                    <b>
                      {session.title}
                      <small>Coach {session.coachName} · {session.sessionType}</small>
                    </b>
                  </span>
                  <span className={styles.occupancy}>
                    <strong>{session.bookedCount}</strong>
                    <small>checked in</small>
                  </span>
                  <ChevronRight size={16} className={styles.arrowIcon} />
                </button>
              ))}
              {!data.sessions.length ? (
                <p className={styles.panelEmpty}>No sessions scheduled for today.</p>
              ) : null}
            </div>
          </section>

          {/* Coaching Right Now / Today Panel */}
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelTag}>COACHING FLOOR</span>
                <h2>Coaches Today</h2>
              </div>
              <button
                type="button"
                className={styles.headerBtn}
                onClick={() => router.push("/admin/coaches")}
              >
                View coaches <ArrowRight size={14} />
              </button>
            </header>

            <div className={styles.coachesGrid}>
              {data.coaches.map((coach, index) => (
                <button
                  type="button"
                  key={coach.id}
                  className={styles.coachCard}
                  data-on-floor={coach.status === "On floor" || undefined}
                  onClick={() => setSelectedCoach(coach)}
                >
                  <i data-tone={tones[index % tones.length]}>{coach.initials}</i>
                  <div className={styles.coachInfo}>
                    <b>{coach.fullName}</b>
                    <small>{coach.specialization}</small>
                    <span className={styles.coachStatusBadge} data-status={coach.status}>
                      {coach.status === "On floor" ? "● LIVE ON FLOOR" : coach.status}
                    </span>
                    <em className={styles.coachDetail}>{coach.detail}</em>
                  </div>
                  <ChevronRight size={14} className={styles.coachArrow} />
                </button>
              ))}
              {!data.coaches.length ? (
                <p className={styles.panelEmpty}>No coaches scheduled in sessions today.</p>
              ) : null}
            </div>
          </section>
        </div>

        {/* Right Aside Column: Action Required & Financial Activity */}
        <aside className={styles.aside}>
          {/* Priority Action Required: Trials */}
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelTag} data-tone="danger">
                  ACTION REQUIRED
                </span>
                <h2>Trials to Close</h2>
              </div>
              <button
                type="button"
                className={styles.headerBtn}
                onClick={() => router.push("/admin/leads")}
              >
                All leads <ArrowRight size={14} />
              </button>
            </header>

            <div className={styles.personList}>
              {data.trials.map((trial, index) => (
                <button
                  type="button"
                  key={trial.id}
                  className={styles.personItem}
                  onClick={() => setSelectedTrial(trial)}
                >
                  <i data-tone={tones[index % tones.length]}>{trial.initials}</i>
                  <span className={styles.personDetails}>
                    <b>{trial.fullName}</b>
                    <small>{trial.groupName}</small>
                  </span>
                  <span className={styles.badgeDanger}>Trial Done</span>
                  <ChevronRight size={14} className={styles.arrowIcon} />
                </button>
              ))}
              {!data.trials.length ? (
                <p className={styles.panelEmpty}>No pending trials requiring outcome today.</p>
              ) : null}
            </div>
          </section>

          {/* Priority Action Required: Renewals */}
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.panelTag} data-tone="warning">
                  SUBSCRIPTIONS
                </span>
                <h2>Renew This Week</h2>
              </div>
              <button
                type="button"
                className={styles.headerBtn}
                onClick={() => router.push("/admin/subscriptions")}
              >
                View all <ArrowRight size={14} />
              </button>
            </header>

            <div className={styles.personList}>
              {data.renewals.map((renewal, index) => (
                <button
                  type="button"
                  key={renewal.id}
                  className={styles.personItem}
                  onClick={() => setSelectedRenewal(renewal)}
                >
                  <i data-tone={tones[index % tones.length]}>{renewal.initials}</i>
                  <span className={styles.personDetails}>
                    <b>{renewal.fullName}</b>
                    <small>
                      {renewal.planName} · {renewal.amountLabel}
                    </small>
                  </span>
                  <em className={styles.dueTag}>{renewal.dueLabel}</em>
                  <ChevronRight size={14} className={styles.arrowIcon} />
                </button>
              ))}
              {!data.renewals.length ? (
                <p className={styles.panelEmpty}>No subscriptions expiring this week.</p>
              ) : null}
            </div>
          </section>

          {/* Cash Today Breakdown */}
          <section className={styles.cashPanel}>
            <header className={styles.cashHeader}>
              <div>
                <span className={styles.cashTag}>
                  <CircleDollarSign size={13} /> CASH TODAY
                </span>
                <h2>{data.cashTodayLabel}</h2>
              </div>
              <button
                type="button"
                className={styles.headerBtn}
                onClick={() => router.push("/admin/reports")}
              >
                Cash flow <ArrowRight size={14} />
              </button>
            </header>

            <div className={styles.paymentList}>
              {data.recentPayments.map((payment) => (
                <button
                  type="button"
                  key={payment.id}
                  className={styles.paymentItem}
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className={styles.paymentIcon}>
                    <CircleDollarSign size={16} />
                  </div>
                  <div className={styles.paymentInfo}>
                    <b>{payment.description}</b>
                    <small>{payment.timeLabel}</small>
                  </div>
                  <strong className={styles.paymentAmount}>{payment.amountLabel}</strong>
                </button>
              ))}
              {!data.recentPayments.length ? (
                <p className={styles.panelEmpty}>No payments recorded yet today.</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      {/* ================= IN-PLACE DETAIL INSPECTOR MODALS ================= */}

      {/* 1. Session Detail Modal */}
      {selectedSession ? (
        <EntityDialog
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
          title={`Session: ${selectedSession.title}`}
          description="Operational breakdown and roster details for this session."
          closeLabel="Close session inspection"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderGrid}>
              <div className={styles.modalBadgeRow}>
                <span className={styles.modalTag}>
                  <Clock size={13} /> {selectedSession.timeLabel}
                </span>
                <span className={styles.modalTag}>
                  {selectedSession.durationLabel}
                </span>
                <span className={styles.modalTag} data-live={selectedSession.isLive || undefined}>
                  {selectedSession.isLive ? "LIVE NOW" : selectedSession.sessionType}
                </span>
              </div>
            </div>

            <div className={styles.modalDetailRows}>
              <div className={styles.modalDetailRow}>
                <span>Coach</span>
                <strong>{selectedSession.coachName}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Checked-In Bookings</span>
                <strong>{selectedSession.bookedCount} clients</strong>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                onClick={() => {
                  const id = selectedSession.id;
                  setSelectedSession(null);
                  router.push(`/admin/attendance?session=${encodeURIComponent(id)}`);
                }}
              >
                <UserCheck size={15} /> Open Attendance & Rosters
              </button>
            </div>
          </div>
        </EntityDialog>
      ) : null}

      {/* 2. Coach Detail Modal */}
      {selectedCoach ? (
        <EntityDialog
          open={!!selectedCoach}
          onOpenChange={(open) => !open && setSelectedCoach(null)}
          title={`Coach: ${selectedCoach.fullName}`}
          description="Coaching assignment and floor activity today."
          closeLabel="Close coach inspection"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalDetailRows}>
              <div className={styles.modalDetailRow}>
                <span>Specialization</span>
                <strong>{selectedCoach.specialization}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Floor Status</span>
                <strong data-status={selectedCoach.status}>
                  {selectedCoach.status === "On floor" ? "● On Floor Now" : selectedCoach.status}
                </strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Current Activity</span>
                <strong>{selectedCoach.detail}</strong>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => setSelectedCoach(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                onClick={() => {
                  setSelectedCoach(null);
                  router.push("/admin/coaches");
                }}
              >
                <ExternalLink size={15} /> View Coaches Command Center
              </button>
            </div>
          </div>
        </EntityDialog>
      ) : null}

      {/* 3. Trial Lead Detail Modal */}
      {selectedTrial ? (
        <EntityDialog
          open={!!selectedTrial}
          onOpenChange={(open) => !open && setSelectedTrial(null)}
          title={`Lead Trial: ${selectedTrial.fullName}`}
          description="Trial outcome pending for conversion."
          closeLabel="Close lead inspection"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalDetailRows}>
              <div className={styles.modalDetailRow}>
                <span>Trial Group</span>
                <strong>{selectedTrial.groupName}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Phone Number</span>
                <strong>{formatPhoneNumber(selectedTrial.phone)}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Status</span>
                <strong className={styles.badgeDanger}>Trial Done — Needs Outcome</strong>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => setSelectedTrial(null)}
              >
                Close
              </button>
              {selectedTrial.phone && !selectedTrial.phone.includes("No phone") ? (
                <a
                  href={`https://wa.me/${selectedTrial.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mv-btn mv-btn-secondary"
                >
                  <MessageCircle size={15} /> Contact WhatsApp
                </a>
              ) : null}
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                onClick={() => {
                  setSelectedTrial(null);
                  router.push("/admin/leads");
                }}
              >
                <ExternalLink size={15} /> Open Leads Workspace
              </button>
            </div>
          </div>
        </EntityDialog>
      ) : null}

      {/* 4. Renewal Detail Modal */}
      {selectedRenewal ? (
        <EntityDialog
          open={!!selectedRenewal}
          onOpenChange={(open) => !open && setSelectedRenewal(null)}
          title={`Subscription Renewal: ${selectedRenewal.fullName}`}
          description="Upcoming client membership renewal details."
          closeLabel="Close renewal inspection"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalDetailRows}>
              <div className={styles.modalDetailRow}>
                <span>Subscription Plan</span>
                <strong>{selectedRenewal.planName}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Price / Amount</span>
                <strong>{selectedRenewal.amountLabel}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Renewal Due</span>
                <strong className={styles.dueTag}>{selectedRenewal.dueLabel}</strong>
              </div>
              {selectedRenewal.methodLabel ? (
                <div className={styles.modalDetailRow}>
                  <span>Last Payment Method</span>
                  <strong>{selectedRenewal.methodLabel}</strong>
                </div>
              ) : null}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => setSelectedRenewal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                onClick={() => {
                  setSelectedRenewal(null);
                  router.push("/admin/subscriptions");
                }}
              >
                <ExternalLink size={15} /> Subscriptions Workspace
              </button>
            </div>
          </div>
        </EntityDialog>
      ) : null}

      {/* 5. Cash Entry Detail Modal */}
      {selectedPayment ? (
        <EntityDialog
          open={!!selectedPayment}
          onOpenChange={(open) => !open && setSelectedPayment(null)}
          title="Cash Entry Detail"
          description="Transaction recorded on today's studio ledger."
          closeLabel="Close payment inspection"
          size="small"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalDetailRows}>
              <div className={styles.modalDetailRow}>
                <span>Description</span>
                <strong>{selectedPayment.description}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Amount</span>
                <strong className={styles.paymentAmount}>{selectedPayment.amountLabel}</strong>
              </div>
              <div className={styles.modalDetailRow}>
                <span>Time Recorded</span>
                <strong>{selectedPayment.timeLabel}</strong>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="mv-btn mv-btn-secondary"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                onClick={() => {
                  setSelectedPayment(null);
                  router.push("/admin/reports");
                }}
              >
                <ExternalLink size={15} /> Open Cash Flow Reports
              </button>
            </div>
          </div>
        </EntityDialog>
      ) : null}
    </div>
  );
}
