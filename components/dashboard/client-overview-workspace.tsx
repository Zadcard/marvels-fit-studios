"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  FileText,
  MapPin,
  Save,
  ShieldUser,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";

import { saveClientPrivateNote } from "@/app/actions/client-private-notes";
import type { ClientOverviewData } from "@/lib/dashboard/client-dashboard-data";
import styles from "./client-overview-workspace.module.css";

type ClientOverviewWorkspaceProps = {
  data: ClientOverviewData;
};

function sessionTone(status: string) {
  if (status === "Check-in ready") return styles.ready;
  if (status === "Waitlist") return styles.waitlist;
  return styles.booked;
}

export function ClientOverviewWorkspace({
  data,
}: ClientOverviewWorkspaceProps) {
  const [filesOpen, setFilesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteMessage, setNoteMessage] = useState("");
  const [savingNote, startSavingNote] = useTransition();
  const nextSession = data.upcomingSessions[0];
  const readyNow = data.upcomingSessions.filter(
    (session) => session.status === "Check-in ready",
  ).length;

  function resetNote() {
    setEditingNoteId(null);
    setNoteDraft("");
  }

  function saveNote() {
    setNoteMessage("");
    startSavingNote(async () => {
      try {
        await saveClientPrivateNote({
          noteId: editingNoteId,
          content: noteDraft,
        });
        setNoteMessage(
          editingNoteId ? "Private note updated." : "Private note added.",
        );
        resetNote();
      } catch (caught) {
        setNoteMessage(
          caught instanceof Error
            ? caught.message
            : "Could not save private note.",
        );
      }
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Member home</span>
          <h1>Train with a clear next step.</h1>
          <p>
            Your next session, coach support and membership status in one calm,
            focused view.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className="mv-btn mv-btn-secondary"
            onClick={() => setFilesOpen(true)}
          >
            <FileText size={17} /> Files{" "}
            {data.activeFiles.length ? `· ${data.activeFiles.length}` : ""}
          </button>
          <Link href="/client/sessions" className="mv-btn mv-btn-primary">
            <Sparkles size={17} /> My sessions
          </Link>
        </div>
      </header>

      <section className={styles.pulse}>
        <article className={styles.nextSession}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Your next session</span>
              <h2>{nextSession ? nextSession.title : "Nothing booked yet"}</h2>
            </div>
            <Link href="/client/sessions" aria-label="Open member sessions">
              <ArrowUpRight size={19} />
            </Link>
          </div>
          {nextSession ? (
            <div className={styles.nextBody}>
              <div className={styles.timeBlock}>
                <strong>{nextSession.timeLabel}</strong>
                <span>{nextSession.dayLabel}</span>
              </div>
              <div className={styles.sessionMeta}>
                <span
                  className={`${styles.status} ${sessionTone(nextSession.status)}`}
                >
                  {nextSession.status}
                </span>
                <p>
                  {nextSession.sessionType} training with{" "}
                  {nextSession.coachName}
                </p>
                <small>
                  <MapPin size={14} /> {nextSession.location}
                </small>
              </div>
              <Link href="/client/sessions">
                View details <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className={styles.empty}>
              <CalendarCheck2 size={25} />
              <strong>Your schedule is open</strong>
              <span>New bookings will appear here automatically.</span>
            </div>
          )}
        </article>

        <aside className={styles.coachCard}>
          <ShieldUser size={24} />
          <span className={styles.kicker}>Your coach</span>
          <h2>{data.coachSnapshot.fullName}</h2>
          <p>{data.coachSnapshot.specialization}</p>
          <dl>
            <dt>Next touchpoint</dt>
            <dd>{data.coachSnapshot.nextTouchpoint}</dd>
          </dl>
          <Link href="/client/coach">
            Open coach profile <ArrowRight size={16} />
          </Link>
        </aside>
      </section>

      <section
        className={styles.scoreboard}
        aria-label="Member overview metrics"
      >
        {data.stats.slice(0, 3).map((stat, index) => (
          <article key={stat.id} data-dark={index === 2 || undefined}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.change}</small>
          </article>
        ))}
        <article className={styles.membershipMetric}>
          <span>Membership</span>
          <strong>{data.subscriptionSnapshot.paymentStatus}</strong>
          <small>{data.subscriptionSnapshot.renewalLabel}</small>
        </article>
      </section>

      <section className={styles.upcoming}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.kicker}>This week</span>
            <h2>Your training line-up</h2>
          </div>
          <div className={styles.readySignal}>
            <CheckCircle2 size={16} /> {readyNow} ready for check-in
          </div>
        </div>
        {data.upcomingSessions.length ? (
          <div className={styles.sessionRail}>
            {data.upcomingSessions.map((session, index) => (
              <Link href="/client/sessions" key={session.id}>
                <span className={styles.sequence}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <span
                    className={`${styles.status} ${sessionTone(session.status)}`}
                  >
                    {session.status}
                  </span>
                  <h3>{session.title}</h3>
                  <p>
                    {session.coachName} · {session.location}
                  </p>
                </div>
                <time>
                  <Clock3 size={14} /> {session.dayLabel}, {session.timeLabel}
                </time>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <CalendarCheck2 size={25} />
            <strong>No upcoming sessions</strong>
            <span>Your next booking will appear here.</span>
          </div>
        )}
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.notes}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Private space</span>
              <h2>Keep a training note</h2>
              <p>
                Only you can see these reminders from your member dashboard.
              </p>
            </div>
            <Edit3 size={20} />
          </div>
          <div className={styles.noteComposer}>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="What do you want to remember for your next session?"
              rows={3}
            />
            <div>
              {editingNoteId ? (
                <button
                  type="button"
                  className="mv-btn mv-btn-secondary"
                  onClick={resetNote}
                >
                  <X size={15} /> Cancel
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="mv-btn mv-btn-primary"
                disabled={savingNote || !noteDraft.trim()}
                onClick={saveNote}
              >
                <Save size={15} />{" "}
                {savingNote
                  ? "Saving…"
                  : editingNoteId
                    ? "Update note"
                    : "Add note"}
              </button>
            </div>
            {noteMessage ? <p role="status">{noteMessage}</p> : null}
          </div>
          {data.privateNotes.length ? (
            <ul className={styles.noteList}>
              {data.privateNotes.map((note) => (
                <li key={note.id}>
                  <div>
                    <strong>{note.updatedAtLabel}</strong>
                    <p>{note.content}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit note from ${note.updatedAtLabel}`}
                    onClick={() => {
                      setEditingNoteId(note.id);
                      setNoteDraft(note.content);
                      setNoteMessage("");
                    }}
                  >
                    <Edit3 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <aside className={styles.sideStack}>
          <article className={styles.membershipCard}>
            <CreditCard size={23} />
            <span className={styles.kicker}>Your plan</span>
            <h2>{data.subscriptionSnapshot.planName}</h2>
            <p>{data.subscriptionSnapshot.benefitLine}</p>
            <strong>{data.subscriptionSnapshot.renewalLabel}</strong>
            <Link href="/client/subscription">
              Plan details <ArrowRight size={16} />
            </Link>
          </article>
          <article className={styles.activityCard}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.kicker}>Recent updates</span>
                <h2>What changed</h2>
              </div>
              <Activity size={19} />
            </div>
            {data.recentActivity.length ? (
              <ol>
                {data.recentActivity.map((item) => (
                  <li key={item.id}>
                    <span />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <small>{item.timeLabel}</small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className={styles.empty}>
                <Activity size={24} />
                <strong>No updates yet</strong>
              </div>
            )}
          </article>
        </aside>
      </section>

      <Dialog.Root open={filesOpen} onOpenChange={setFilesOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.filesDialog}>
            <Dialog.Title>Coach files</Dialog.Title>
            <Dialog.Description>
              Files shared by your coach expire after three days.
            </Dialog.Description>
            <Dialog.Close className={styles.close} aria-label="Close files">
              <X size={18} />
            </Dialog.Close>
            {data.activeFiles.length ? (
              <div className={styles.fileList}>
                {data.activeFiles.map((file) => (
                  <article key={file.id}>
                    <FileText size={20} />
                    <div>
                      <strong>{file.name}</strong>
                      <p>{file.note}</p>
                      <small>Expires {file.expiresAtLabel}</small>
                    </div>
                    <a
                      href={file.downloadHref}
                      aria-label={`Download ${file.name}`}
                    >
                      <Download size={17} />
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <FileText size={25} />
                <strong>No active files</strong>
                <span>New coach uploads will appear here.</span>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
