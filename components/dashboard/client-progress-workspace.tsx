"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Dumbbell,
  Gauge,
  HeartPulse,
  Send,
  Target,
  TrendingUp,
} from "lucide-react";

import { submitClientCheckIn } from "@/app/actions/client-check-ins";
import type { ClientProgressData } from "@/lib/dashboard/client-progress";
import styles from "./client-progress-workspace.module.css";

type Props = { data: ClientProgressData };
const scale = [1, 2, 3, 4, 5];
const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
function progress(goal: ClientProgressData["goals"][number]) {
  if (
    goal.baselineValue === null ||
    goal.targetValue === null ||
    goal.currentValue === null ||
    goal.targetValue === goal.baselineValue
  )
    return null;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((goal.currentValue - goal.baselineValue) /
          (goal.targetValue - goal.baselineValue)) *
          100,
      ),
    ),
  );
}

export function ClientProgressWorkspace({ data }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [checkIn, setCheckIn] = useState({
    sleepQuality: 3,
    energyLevel: 3,
    sorenessLevel: 3,
    stressLevel: 3,
    painPresent: false,
    painDetails: "",
    memberNote: "",
  });
  const program =
    data.programs.find((item) => item.status === "ACTIVE") ?? data.programs[0];
  const nextWorkout = program?.workouts[0];
  const activeGoals = data.goals.filter((goal) => goal.status === "ACTIVE");
  function submit() {
    setMessage("");
    start(async () => {
      try {
        await submitClientCheckIn(checkIn);
        setCheckIn({
          sleepQuality: 3,
          energyLevel: 3,
          sorenessLevel: 3,
          stressLevel: 3,
          painPresent: false,
          painDetails: "",
          memberNote: "",
        });
        setMessage("Check-in sent to your coach.");
        router.refresh();
      } catch (caught) {
        setMessage(
          caught instanceof Error ? caught.message : "Could not send check-in.",
        );
      }
    });
  }
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>My progress</span>
          <h1>Build proof, not guesses.</h1>
          <p>
            Your goals, training prescription, measured change and weekly
            readiness in one honest view.
          </p>
        </div>
      </header>
      <section className={styles.next}>
        <div>
          <span className={styles.kicker}>Your next action</span>
          <h2>{nextWorkout?.title ?? "Complete your coaching assessment"}</h2>
          <p>
            {nextWorkout?.notes ||
              program?.goalSummary ||
              "Your coach will publish the next training step here."}
          </p>
        </div>
        <span data-active={program?.status === "ACTIVE" || undefined}>
          {program ? titleCase(program.status) : "Plan pending"}
        </span>
      </section>
      <section className={styles.scoreboard}>
        <article>
          <Target size={18} />
          <span>Primary goal</span>
          <strong>{data.primaryGoal}</strong>
          <small>{data.baselineSummary}</small>
        </article>
        <article>
          <TrendingUp size={18} />
          <span>Active goals</span>
          <strong>{String(activeGoals.length).padStart(2, "0")}</strong>
          <small>{data.goals.length} tracked total</small>
        </article>
        <article>
          <Dumbbell size={18} />
          <span>Workouts logged</span>
          <strong>{String(data.workoutLogs.length).padStart(2, "0")}</strong>
          <small>Delivered by your coach</small>
        </article>
        <article data-dark>
          <Gauge size={18} />
          <span>Measurements</span>
          <strong>{String(data.metrics.length).padStart(2, "0")}</strong>
          <small>Comparable records</small>
        </article>
      </section>
      <section className={styles.goals}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.kicker}>Outcome board</span>
            <h2>What you are working toward</h2>
          </div>
          <Target size={20} />
        </div>
        {data.goals.length ? (
          <div className={styles.goalGrid}>
            {data.goals.map((goal) => {
              const value = progress(goal);
              return (
                <article key={goal.id}>
                  <span>{titleCase(goal.status)}</span>
                  <h3>{goal.title}</h3>
                  <p>
                    {goal.description || "Your coach is tracking this outcome."}
                  </p>
                  <div>
                    <strong>{goal.currentValue ?? "—"}</strong>
                    <small>
                      of {goal.targetValue ?? "—"} {goal.unit}
                    </small>
                  </div>
                  {value !== null ? (
                    <>
                      <i>
                        <b style={{ width: `${value}%` }} />
                      </i>
                      <em>{value}% complete</em>
                    </>
                  ) : null}
                  {goal.targetDate ? (
                    <time>Target {formatDate(goal.targetDate)}</time>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <Target size={25} />
            <strong>No goals published yet</strong>
            <span>
              Your coach will add measurable outcomes after assessment.
            </span>
          </div>
        )}
      </section>
      <section className={styles.planGrid}>
        <article className={styles.program}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Training prescription</span>
              <h2>{program?.name ?? "No active program"}</h2>
              <p>{program?.goalSummary || "Your program will appear here."}</p>
            </div>
            <Dumbbell size={20} />
          </div>
          {program?.workouts.length ? (
            <div className={styles.workouts}>
              {program.workouts.map((workout) => (
                <article key={workout.id}>
                  <header>
                    <span>Day {workout.dayOrder}</span>
                    <h3>{workout.title}</h3>
                    <p>{workout.notes || "Follow the prescribed order."}</p>
                  </header>
                  {workout.exercises.length ? (
                    <ol>
                      {workout.exercises.map((item) => (
                        <li key={item.id}>
                          <span>
                            {String(item.orderIndex).padStart(2, "0")}
                          </span>
                          <div>
                            <strong>{item.exercise.name}</strong>
                            <small>
                              {item.sets} sets × {item.reps}
                              {item.targetLoad !== null
                                ? ` · ${item.targetLoad} ${item.loadUnit}`
                                : ""}
                            </small>
                          </div>
                          <em>
                            {item.restSeconds !== null
                              ? `${item.restSeconds}s rest`
                              : "Coach-paced"}
                          </em>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>No exercises prescribed yet.</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <Dumbbell size={25} />
              <strong>No workouts published</strong>
            </div>
          )}
        </article>
        <aside className={styles.delivered}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Delivered work</span>
              <h2>Recent sessions</h2>
            </div>
            <CheckCircle2 size={20} />
          </div>
          {data.workoutLogs.length ? (
            <ol>
              {data.workoutLogs.slice(0, 8).map((log) => (
                <li key={log.id}>
                  <time>{formatDate(log.performedAt)}</time>
                  <strong>{log.workoutTitle}</strong>
                  <span>RPE {log.sessionRpe ?? "—"}</span>
                  {log.sets.slice(0, 2).map((set) => (
                    <small key={set.id}>
                      {set.exerciseName}: {set.reps ?? "—"} × {set.load ?? "—"}{" "}
                      {set.loadUnit}
                    </small>
                  ))}
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.empty}>
              <Activity size={24} />
              <strong>No delivered workouts yet</strong>
            </div>
          )}
        </aside>
      </section>
      <section className={styles.readinessGrid}>
        <article className={styles.checkIn}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Weekly readiness</span>
              <h2>Tell your coach how you are arriving</h2>
              <p>Use the 1–5 scale before the next training block.</p>
            </div>
            <HeartPulse size={21} />
          </div>
          <div className={styles.scales}>
            {(
              [
                ["sleepQuality", "Sleep quality"],
                ["energyLevel", "Energy level"],
                ["sorenessLevel", "Soreness"],
                ["stressLevel", "Stress"],
              ] as const
            ).map(([field, label]) => (
              <fieldset key={field}>
                <legend>{label}</legend>
                <div>
                  {scale.map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name={field}
                        value={value}
                        checked={checkIn[field] === value}
                        onChange={() =>
                          setCheckIn((current) => ({
                            ...current,
                            [field]: value,
                          }))
                        }
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <label className={styles.pain}>
            <input
              type="checkbox"
              checked={checkIn.painPresent}
              onChange={(event) =>
                setCheckIn((current) => ({
                  ...current,
                  painPresent: event.target.checked,
                }))
              }
            />
            <span>I feel pain my coach should know about</span>
          </label>
          {checkIn.painPresent ? (
            <label className={styles.textField}>
              <span>Where and what does it feel like?</span>
              <textarea
                rows={3}
                value={checkIn.painDetails}
                onChange={(event) =>
                  setCheckIn((current) => ({
                    ...current,
                    painDetails: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}
          <label className={styles.textField}>
            <span>Anything else your coach should know?</span>
            <textarea
              rows={3}
              value={checkIn.memberNote}
              onChange={(event) =>
                setCheckIn((current) => ({
                  ...current,
                  memberNote: event.target.value,
                }))
              }
            />
          </label>
          {message ? <p role="status">{message}</p> : null}
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            disabled={pending}
            onClick={submit}
          >
            <Send size={16} />
            {pending ? "Sending…" : "Send check-in"}
          </button>
        </article>
        <aside className={styles.history}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>Readiness history</span>
              <h2>Coach feedback</h2>
            </div>
            <Activity size={20} />
          </div>
          {data.checkIns.length ? (
            <ol>
              {data.checkIns.map((item) => (
                <li key={item.id}>
                  <time>{formatDate(item.submittedAt)}</time>
                  <div>
                    <span>Sleep {item.sleepQuality}/5</span>
                    <span>Energy {item.energyLevel}/5</span>
                    <span>Soreness {item.sorenessLevel}/5</span>
                  </div>
                  {item.memberNote ? <p>You: {item.memberNote}</p> : null}
                  <strong>
                    {item.coachResponse
                      ? `Coach: ${item.coachResponse}`
                      : "Awaiting coach response"}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.empty}>
              <HeartPulse size={24} />
              <strong>No check-ins yet</strong>
            </div>
          )}
        </aside>
      </section>
      <section className={styles.metrics}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.kicker}>Measurements</span>
            <h2>Progress timeline</h2>
          </div>
          <TrendingUp size={20} />
        </div>
        {data.metrics.length ? (
          <div>
            {data.metrics.map((metric) => (
              <article key={metric.id}>
                <span>{titleCase(metric.metricType)}</span>
                <strong>
                  {metric.value} {metric.unit}
                </strong>
                <time>{formatDate(metric.measuredAt)}</time>
                <p>{metric.note}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <TrendingUp size={24} />
            <strong>No measurements yet</strong>
          </div>
        )}
      </section>
    </div>
  );
}
