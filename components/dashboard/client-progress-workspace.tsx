"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { submitClientCheckIn } from "@/app/actions/client-check-ins";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import type { ClientProgressData } from "@/lib/dashboard/client-progress";

type ClientProgressWorkspaceProps = {
  data: ClientProgressData;
};

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getGoalProgress(goal: ClientProgressData["goals"][number]) {
  if (
    goal.baselineValue === null ||
    goal.targetValue === null ||
    goal.currentValue === null ||
    goal.targetValue === goal.baselineValue
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((goal.currentValue - goal.baselineValue) /
          (goal.targetValue - goal.baselineValue)) *
          100
      )
    )
  );
}

const readinessOptions = [1, 2, 3, 4, 5];

export function ClientProgressWorkspace({ data }: ClientProgressWorkspaceProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
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
  const activeProgram =
    data.programs.find((program) => program.status === "ACTIVE") ??
    data.programs[0];
  const nextWorkout = activeProgram?.workouts[0];
  const activeGoals = data.goals.filter((goal) => goal.status === "ACTIVE");

  const submitCheckIn = () => {
    setMessage("");
    startTransition(async () => {
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
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Could not send check-in."
        );
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="My progress" />

      <section className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <div className="dashboard-panel__header">
          <div>
            <div className="mv-eyebrow">Your next action</div>
            <h2>{nextWorkout?.title ?? "Complete your coaching assessment"}</h2>
            <p>
              {nextWorkout?.notes ||
                activeProgram?.goalSummary ||
                "Your coach will publish the next training step here."}
            </p>
          </div>
          <DashboardStatusBadge
            label={activeProgram ? titleCase(activeProgram.status) : "Plan pending"}
            tone={activeProgram?.status === "ACTIVE" ? "success" : "warning"}
          />
        </div>
        <div className="dashboard-mini-grid">
          <DashboardMiniStat
            label="Primary goal"
            value={data.primaryGoal}
            description={data.baselineSummary}
          />
          <DashboardMiniStat
            label="Active goals"
            value={String(activeGoals.length)}
            description={`${data.goals.length} goals tracked in total.`}
          />
          <DashboardMiniStat
            label="Workouts logged"
            value={String(data.workoutLogs.length)}
            description="Coach-recorded delivered sessions."
          />
          <DashboardMiniStat
            label="Measurements"
            value={String(data.metrics.length)}
            description="Comparable progress records."
          />
        </div>
      </section>

      <section className="dashboard-panel dashboard-panel--dense">
        <div className="dashboard-panel__header">
          <div>
            <div className="mv-eyebrow">Goals</div>
            <h2>What you are working toward</h2>
          </div>
        </div>
        {data.goals.length ? (
          <div className="dashboard-snapshot-list">
            {data.goals.map((goal) => {
              const progress = getGoalProgress(goal);
              return (
                <article key={goal.id} className="dashboard-snapshot-item">
                  <DashboardStatusBadge
                    label={titleCase(goal.status)}
                    tone={goal.status === "ACHIEVED" ? "success" : "accent"}
                  />
                  <strong>{goal.title}</strong>
                  <p>{goal.description || "Your coach is tracking this outcome."}</p>
                  <span>
                    {goal.currentValue ?? "-"} / {goal.targetValue ?? "-"} {goal.unit}
                  </span>
                  {progress !== null ? (
                    <div className="dashboard-progress" aria-label={`${progress}% complete`}>
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  ) : null}
                  {goal.targetDate ? <small>Target {formatDate(goal.targetDate)}</small> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <DashboardEmptyState
            title="No goals published yet"
            description="Your coach will add measurable goals after assessment."
          />
        )}
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Training plan</div>
              <h2>{activeProgram?.name ?? "No active program"}</h2>
              <p>{activeProgram?.goalSummary || "Your program will appear here."}</p>
            </div>
          </div>
          {activeProgram?.workouts.length ? (
            <div className="dashboard-stack">
              {activeProgram.workouts.map((workout) => (
                <article key={workout.id} className="dashboard-form-section">
                  <div className="dashboard-form-section__header">
                    <div>
                      <div className="mv-eyebrow">Day {workout.dayOrder}</div>
                      <h3>{workout.title}</h3>
                      <p>{workout.notes || "Follow the prescribed order."}</p>
                    </div>
                  </div>
                  {workout.exercises.length ? (
                    <div className="dashboard-summary-list">
                      {workout.exercises.map((item) => (
                        <div key={item.id} className="dashboard-summary-row">
                          <strong>
                            {item.orderIndex}. {item.exercise.name}
                          </strong>
                          <span>
                            {item.sets} sets × {item.reps}
                            {item.targetLoad !== null
                              ? ` · ${item.targetLoad} ${item.loadUnit}`
                              : ""}
                          </span>
                          <small>
                            {item.restSeconds !== null
                              ? `${item.restSeconds}s rest`
                              : "Coach-paced rest"}
                            {item.tempo ? ` · ${item.tempo} tempo` : ""}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Exercises have not been prescribed yet.</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No workouts published"
              description="Your coach is preparing the training plan."
            />
          )}
        </article>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Delivered work</div>
              <h2>Recent sessions</h2>
            </div>
          </div>
          {data.workoutLogs.length ? (
            <div className="dashboard-summary-list">
              {data.workoutLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="dashboard-summary-row">
                  <strong>{log.workoutTitle}</strong>
                  <span>{formatDate(log.performedAt)} · RPE {log.sessionRpe ?? "-"}</span>
                  {log.sets.map((set) => (
                    <small key={set.id}>
                      {set.exerciseName}: {set.reps ?? "-"} × {set.load ?? "-"} {set.loadUnit}
                    </small>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No delivered workouts yet"
              description="Completed training will appear here."
            />
          )}
        </aside>
      </section>

      <section className="dashboard-detail-layout">
        <article className="dashboard-panel dashboard-panel--dense">
          <div className="dashboard-panel__header">
            <div>
              <div className="mv-eyebrow">Measurements</div>
              <h2>Progress timeline</h2>
            </div>
          </div>
          {data.metrics.length ? (
            <div className="dashboard-summary-list">
              {data.metrics.map((metric) => (
                <div key={metric.id} className="dashboard-summary-row">
                  <strong>{titleCase(metric.metricType)}</strong>
                  <span>{metric.value} {metric.unit}</span>
                  <small>{formatDate(metric.measuredAt)}{metric.note ? ` · ${metric.note}` : ""}</small>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No measurements yet"
              description="Your baseline and reassessments will appear here."
            />
          )}
        </article>

        <DashboardFormSection
          eyebrow="Weekly check-in"
          title="Tell your coach how you are arriving"
          description="Use a 1–5 scale. Your coach will see pain and readiness flags before planning the next session."
        >
          <div className="dashboard-form-columns">
            {(
              [
                ["sleepQuality", "Sleep quality"],
                ["energyLevel", "Energy level"],
                ["sorenessLevel", "Soreness level"],
                ["stressLevel", "Stress level"],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="dashboard-form-field">
                <span>{label}</span>
                <select
                  className="dashboard-select"
                  value={checkIn[field]}
                  onChange={(event) =>
                    setCheckIn((current) => ({
                      ...current,
                      [field]: Number(event.target.value),
                    }))
                  }
                >
                  {readinessOptions.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label className="dashboard-form-field">
            <span>
              <input
                type="checkbox"
                checked={checkIn.painPresent}
                onChange={(event) =>
                  setCheckIn((current) => ({
                    ...current,
                    painPresent: event.target.checked,
                  }))
                }
              />{" "}
              I feel pain that my coach should know about
            </span>
          </label>
          {checkIn.painPresent ? (
            <label className="dashboard-form-field dashboard-form-field--wide">
              <span>Where and what does it feel like?</span>
              <textarea
                className="dashboard-textarea"
                rows={3}
                value={checkIn.painDetails}
                onChange={(event) =>
                  setCheckIn((current) => ({ ...current, painDetails: event.target.value }))
                }
              />
            </label>
          ) : null}
          <label className="dashboard-form-field dashboard-form-field--wide">
            <span>Anything else your coach should know?</span>
            <textarea
              className="dashboard-textarea"
              rows={4}
              value={checkIn.memberNote}
              onChange={(event) =>
                setCheckIn((current) => ({ ...current, memberNote: event.target.value }))
              }
            />
          </label>
          {message ? <p role="status">{message}</p> : null}
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            disabled={isSubmitting}
            onClick={submitCheckIn}
          >
            <Send size={16} />
            {isSubmitting ? "Sending..." : "Send check-in"}
          </button>
        </DashboardFormSection>
      </section>

      <section className="dashboard-panel dashboard-panel--dense">
        <div className="dashboard-panel__header">
          <div>
            <div className="mv-eyebrow">Check-in history</div>
            <h2>Coach feedback</h2>
          </div>
        </div>
        {data.checkIns.length ? (
          <div className="dashboard-summary-list">
            {data.checkIns.map((item) => (
              <div key={item.id} className="dashboard-summary-row">
                <strong>{formatDate(item.submittedAt)}</strong>
                <span>
                  Sleep {item.sleepQuality}/5 · Energy {item.energyLevel}/5 · Soreness {item.sorenessLevel}/5
                </span>
                {item.memberNote ? <small>You: {item.memberNote}</small> : null}
                <small>
                  {item.coachResponse
                    ? `Coach: ${item.coachResponse}`
                    : "Awaiting coach response"}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            title="No check-ins yet"
            description="Your first check-in will start the readiness history."
          />
        )}
      </section>
    </div>
  );
}
