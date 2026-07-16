"use client";

import Link from "next/link";
import { ArrowLeft, CalendarRange, Pause, Play, Repeat2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createRecurringSessionTemplate,
  generateRecurringSessions,
  setRecurringTemplateActive,
} from "@/app/actions/admin-recurring-sessions";
import type { Database } from "@/lib/supabase/database.types";
import styles from "./recurring-session-workspace.module.css";

type Template = Database["public"]["Tables"]["RecurringSessionTemplate"]["Row"] & {
  coach: { fullName: string };
  group: { name: string } | null;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function RecurringSessionWorkspace({ templates, coaches, groups }: {
  templates: Template[];
  coaches: Array<{ id: string; fullName: string }>;
  groups: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const activeCount = templates.filter((template) => template.active).length;

  const run = (work: () => Promise<unknown>, success: string) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await work();
        setMessage(success);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Action failed.");
      }
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}><Repeat2 size={14} /> Weekly cadence</span>
          <h1 style={{ color: "var(--rl-white)" }}>Program once.<br />Run every week.</h1>
          <p>Turn a coaching block into a repeatable studio rhythm, then generate the real calendar only when you are ready.</p>
        </div>
        <div className={styles.heroRail}>
          <div><strong>{templates.length}</strong><span>Rules built</span></div>
          <div><strong>{activeCount}</strong><span>Rules live</span></div>
          <Link href="/admin/schedule"><ArrowLeft size={16} /> Calendar</Link>
        </div>
      </header>

      {(error || message) ? (
        <div className={styles.feedback} data-error={Boolean(error)} role="status">
          <strong>{error ? "Action stopped" : "Cadence updated"}</strong>
          <span>{error || message}</span>
        </div>
      ) : null}

      <div className={styles.workspace}>
        <section className={styles.builder} aria-labelledby="builder-title">
          <div className={styles.sectionHeading}>
            <div><span>01 / Build</span><h2 id="builder-title">New weekly rule</h2></div>
            <Sparkles />
          </div>
          <form className={styles.form} onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            run(() => createRecurringSessionTemplate({
              title: String(form.get("title")),
              description: String(form.get("description")),
              type: String(form.get("type")) as "GROUP" | "PRIVATE",
              coachId: String(form.get("coachId")),
              groupId: String(form.get("groupId")),
              location: String(form.get("location")),
              capacity: Number(form.get("capacity")),
              weekday: Number(form.get("weekday")),
              localStartTime: String(form.get("localStartTime")),
              durationMinutes: Number(form.get("durationMinutes")),
              startsOn: String(form.get("startsOn")),
              endsOn: String(form.get("endsOn")),
            }), "Template created.");
          }}>
            <label className={styles.wide}><span>Session title</span><input name="title" required minLength={2} placeholder="Strength foundations" /></label>
            <label><span>Coach</span><select name="coachId" required>{coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.fullName}</option>)}</select></label>
            <label><span>Format</span><select name="type"><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label>
            <label><span>Training group</span><select name="groupId"><option value="">No group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
            <label><span>Day</span><select name="weekday">{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
            <label><span>Start</span><input name="localStartTime" type="time" defaultValue="18:00" required /></label>
            <label><span>Minutes</span><input name="durationMinutes" type="number" min="15" max="480" defaultValue="60" required /></label>
            <label><span>Capacity</span><input name="capacity" type="number" min="1" max="100" defaultValue="12" required /></label>
            <label><span>Starts on</span><input name="startsOn" type="date" required /></label>
            <label><span>Ends on</span><input name="endsOn" type="date" /></label>
            <label><span>Location</span><input name="location" placeholder="Studio floor" /></label>
            <label className={styles.wide}><span>Coach brief</span><textarea name="description" rows={3} placeholder="Intent, equipment, or progression notes" /></label>
            <button className={styles.createButton} disabled={pending || coaches.length === 0}><Repeat2 size={17} /> Create weekly rule</button>
          </form>
        </section>

        <section className={styles.rules} aria-labelledby="rules-title">
          <div className={styles.sectionHeading}>
            <div><span>02 / Deploy</span><h2 id="rules-title">Cadence stack</h2></div>
            <CalendarRange />
          </div>
          {templates.length ? (
            <div className={styles.ruleList}>
              {templates.map((template, index) => (
                <article className={styles.rule} data-active={template.active} key={template.id}>
                  <div className={styles.ruleIndex}>{String(index + 1).padStart(2, "0")}</div>
                  <div className={styles.ruleCopy}>
                    <div className={styles.ruleMeta}><span>{template.type}</span><span>{template.active ? "Live" : "Paused"}</span></div>
                    <h3>{template.title}</h3>
                    <p>{weekdays[template.weekday]} · {template.localStartTime.slice(0, 5)} · {template.coach.fullName}</p>
                    <small>{template.group?.name ?? "No group"} · Generated through {template.lastGeneratedThrough ?? "not yet"}</small>
                  </div>
                  <form className={styles.ruleActions} onSubmit={(event) => {
                    event.preventDefault();
                    const throughDate = String(new FormData(event.currentTarget).get("throughDate"));
                    run(() => generateRecurringSessions({ templateId: template.id, throughDate }), "Schedule generated.");
                  }}>
                    <label><span>Generate through</span><input name="throughDate" type="date" required /></label>
                    <button className={styles.generateButton} disabled={pending || !template.active}>Generate</button>
                    <button type="button" className={styles.toggleButton} disabled={pending} onClick={() => run(() => setRecurringTemplateActive(template.id, !template.active), template.active ? "Template paused." : "Template activated.")}>
                      {template.active ? <Pause size={15} /> : <Play size={15} />}{template.active ? "Pause" : "Activate"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}><Repeat2 size={30} /><strong>No cadence rules yet.</strong><p>Build the first rule on the left to create a repeatable session rhythm.</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
