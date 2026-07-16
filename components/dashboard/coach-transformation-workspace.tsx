"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  Dumbbell,
  FlaskConical,
  HeartPulse,
  Plus,
  Save,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  addProgramWorkout,
  addProgressMetric,
  addWorkoutExercise,
  createExercise,
  recordWorkoutPerformance,
  respondToClientCheckIn,
  saveClientAssessment,
  saveClientGoal,
  saveTrainingProgram,
} from "@/app/actions/coach-transformation";
import type { ClientTransformationData } from "@/lib/dashboard/client-transformation";
import styles from "./coach-transformation-workspace.module.css";

type Props = { data: ClientTransformationData };
type Phase = "assessment" | "outcomes" | "program" | "delivery" | "readiness";
const today = new Date().toISOString().slice(0, 10);
const phases: Array<{ id: Phase; label: string }> = [
  { id: "assessment", label: "Assessment" },
  { id: "outcomes", label: "Outcomes" },
  { id: "program", label: "Program" },
  { id: "delivery", label: "Delivery" },
  { id: "readiness", label: "Readiness" },
];
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

export function CoachTransformationWorkspace({ data }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [phase, setPhase] = useState<Phase>("assessment");
  const [message, setMessage] = useState("Performance record ready.");
  const [assessment, setAssessment] = useState({
    status: data.assessment?.status ?? ("DRAFT" as const),
    experienceLevel: data.assessment?.experienceLevel ?? "",
    primaryGoal: data.assessment?.primaryGoal ?? "",
    secondaryGoals: data.assessment?.secondaryGoals ?? "",
    injuriesLimitations: data.assessment?.injuriesLimitations ?? "",
    medicalNotes: data.assessment?.medicalNotes ?? "",
    baselineSummary: data.assessment?.baselineSummary ?? "",
    consentAcknowledged: data.assessment?.consentAcknowledged ?? false,
  });
  const [goal, setGoal] = useState({
    title: "",
    description: "",
    metricType: "",
    baselineValue: "",
    targetValue: "",
    currentValue: "",
    unit: "",
    targetDate: "",
    status: "ACTIVE" as const,
  });
  const [program, setProgram] = useState({
    name: "",
    goalSummary: "",
    status: "DRAFT" as const,
    startsAt: today,
    endsAt: "",
  });
  const [workout, setWorkout] = useState({
    programId: data.programs[0]?.id ?? "",
    title: "",
    dayOrder: "1",
    notes: "",
  });
  const [exercise, setExercise] = useState({
    name: "",
    category: "Strength",
    instructions: "",
    defaultUnit: "kg",
  });
  const allWorkouts = useMemo(
    () =>
      data.programs.flatMap((item) =>
        item.workouts.map((entry) => ({ ...entry, programName: item.name })),
      ),
    [data.programs],
  );
  const [prescription, setPrescription] = useState({
    workoutId: allWorkouts[0]?.id ?? "",
    exerciseId: data.exercises[0]?.id ?? "",
    orderIndex: "1",
    sets: "3",
    reps: "8",
    targetLoad: "",
    loadUnit: "kg",
    tempo: "",
    restSeconds: "90",
    notes: "",
  });
  const [metric, setMetric] = useState({
    metricType: "body_weight",
    value: "",
    unit: "kg",
    note: "",
  });
  const [performance, setPerformance] = useState({
    workoutId: allWorkouts[0]?.id ?? "",
    exerciseId: allWorkouts[0]?.exercises[0]?.exercise.id ?? "",
    setNumber: "1",
    reps: "",
    load: "",
    loadUnit: "kg",
    rpe: "7",
    durationMinutes: "60",
    sessionRpe: "7",
    notes: "",
  });
  const [responses, setResponses] = useState<Record<string, string>>({});
  const activeProgram =
    data.programs.find((item) => item.status === "ACTIVE") ?? data.programs[0];

  function run(success: string, action: () => Promise<unknown>) {
    setMessage("");
    start(async () => {
      try {
        await action();
        setMessage(success);
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Action failed.");
      }
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <Link href="/coach/clients">
            <ArrowLeft size={15} /> Client roster
          </Link>
          <span className={styles.kicker}>Performance lab</span>
          <h1>Engineer the outcome.</h1>
          <p>
            Assessment, prescription, delivered work and readiness for{" "}
            {data.client.fullName}.
          </p>
        </div>
        <FlaskConical aria-hidden="true" />
      </header>

      <section className={styles.command}>
        <div>
          <span>Member</span>
          <strong>{data.client.fullName}</strong>
          <small>{data.client.phone || "No phone recorded"}</small>
        </div>
        <div>
          <span>Assessment</span>
          <strong>
            {data.assessment ? titleCase(data.assessment.status) : "Missing"}
          </strong>
          <small>{data.assessment?.primaryGoal || "Baseline required"}</small>
        </div>
        <div>
          <span>Active outcomes</span>
          <strong>
            {String(
              data.goals.filter((item) => item.status === "ACTIVE").length,
            ).padStart(2, "0")}
          </strong>
          <small>{data.goals.length} total records</small>
        </div>
        <div data-dark>
          <span>Live program</span>
          <strong>{activeProgram?.name ?? "Not assigned"}</strong>
          <small>{activeProgram?.workouts.length ?? 0} workout days</small>
        </div>
      </section>

      <div className={styles.phaseBar}>
        <nav aria-label="Transformation workflow">
          {phases.map((item, index) => (
            <button
              key={item.id}
              type="button"
              data-active={phase === item.id || undefined}
              onClick={() => setPhase(item.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <p role="status" data-pending={pending || undefined}>
          {pending ? "Saving to the performance record…" : message}
        </p>
      </div>

      {phase === "assessment" ? (
        <section className={styles.panel}>
          <PanelHead
            icon={<ClipboardCheck />}
            step="01 / Baseline"
            title="Assessment and safety"
            description="Record intent, limitations and consent before prescribing load."
          />
          <div className={styles.fields}>
            <Field label="Experience level">
              <input
                value={assessment.experienceLevel}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    experienceLevel: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Assessment state">
              <select
                value={assessment.status}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    status: event.target.value as "DRAFT" | "COMPLETE",
                  }))
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="COMPLETE">Complete</option>
              </select>
            </Field>
            <Field label="Primary goal" wide>
              <textarea
                rows={3}
                value={assessment.primaryGoal}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    primaryGoal: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Secondary goals">
              <textarea
                rows={4}
                value={assessment.secondaryGoals}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    secondaryGoals: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Injuries or limitations">
              <textarea
                rows={4}
                value={assessment.injuriesLimitations}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    injuriesLimitations: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Medical notes">
              <textarea
                rows={4}
                value={assessment.medicalNotes}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    medicalNotes: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Baseline summary">
              <textarea
                rows={4}
                value={assessment.baselineSummary}
                onChange={(event) =>
                  setAssessment((current) => ({
                    ...current,
                    baselineSummary: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={assessment.consentAcknowledged}
              onChange={(event) =>
                setAssessment((current) => ({
                  ...current,
                  consentAcknowledged: event.target.checked,
                }))
              }
            />
            <span>Consent and readiness discussion acknowledged</span>
          </label>
          <ActionButton
            pending={pending}
            label="Save assessment"
            onClick={() =>
              run("Assessment saved.", () =>
                saveClientAssessment({
                  clientId: data.client.id,
                  assessmentId: data.assessment?.id,
                  ...assessment,
                }),
              )
            }
          />
        </section>
      ) : null}

      {phase === "outcomes" ? (
        <section className={styles.split}>
          <article className={styles.panel}>
            <PanelHead
              icon={<Target />}
              step="02 / Outcomes"
              title="Set a measurable target"
              description="Define the number that proves the program worked."
            />
            <div className={styles.fields}>
              <Field label="Goal title">
                <input
                  value={goal.title}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Metric">
                <input
                  placeholder="e.g. deadlift"
                  value={goal.metricType}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      metricType: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Baseline">
                <input
                  type="number"
                  value={goal.baselineValue}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      baselineValue: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Target">
                <input
                  type="number"
                  value={goal.targetValue}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      targetValue: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Current">
                <input
                  type="number"
                  value={goal.currentValue}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      currentValue: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Unit">
                <input
                  value={goal.unit}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Target date">
                <input
                  type="date"
                  value={goal.targetDate}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      targetDate: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Description" wide>
                <textarea
                  rows={3}
                  value={goal.description}
                  onChange={(event) =>
                    setGoal((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={pending}
              label="Add outcome"
              onClick={() =>
                run("Outcome added.", () =>
                  saveClientGoal({ clientId: data.client.id, ...goal }),
                )
              }
            />
          </article>
          <aside className={styles.board}>
            <PanelHead
              icon={<TrendingUp />}
              step="Goal board"
              title={`${data.goals.length} outcomes`}
            />
            {data.goals.length ? (
              <ol>
                {data.goals.map((item) => (
                  <li key={item.id}>
                    <span>{titleCase(item.status)}</span>
                    <strong>{item.title}</strong>
                    <b>
                      {item.currentValue ?? "—"} / {item.targetValue ?? "—"}{" "}
                      {item.unit}
                    </b>
                    <small>
                      {item.targetDate
                        ? formatDate(item.targetDate)
                        : "No target date"}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty label="No outcomes yet" />
            )}
          </aside>
        </section>
      ) : null}

      {phase === "program" ? (
        <section className={styles.programGrid}>
          <article className={styles.panel}>
            <PanelHead
              icon={<Dumbbell />}
              step="03 / Program"
              title="Build the training system"
              description="Create the block, its training days and the work inside each day."
            />
            <Subhead title="A. Training block" />
            <div className={styles.fields}>
              <Field label="Program name">
                <input
                  value={program.name}
                  onChange={(event) =>
                    setProgram((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="State">
                <select
                  value={program.status}
                  onChange={(event) =>
                    setProgram((current) => ({
                      ...current,
                      status: event.target.value as typeof current.status,
                    }))
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>
              <Field label="Starts">
                <input
                  type="date"
                  value={program.startsAt}
                  onChange={(event) =>
                    setProgram((current) => ({
                      ...current,
                      startsAt: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Ends">
                <input
                  type="date"
                  value={program.endsAt}
                  onChange={(event) =>
                    setProgram((current) => ({
                      ...current,
                      endsAt: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Goal summary" wide>
                <textarea
                  rows={3}
                  value={program.goalSummary}
                  onChange={(event) =>
                    setProgram((current) => ({
                      ...current,
                      goalSummary: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={pending}
              label="Save new program"
              onClick={() =>
                run("Program saved.", () =>
                  saveTrainingProgram({ clientId: data.client.id, ...program }),
                )
              }
            />

            <Subhead title="B. Add workout day" />
            <div className={styles.fields}>
              <Field label="Program">
                <select
                  value={workout.programId}
                  onChange={(event) =>
                    setWorkout((current) => ({
                      ...current,
                      programId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose program</option>
                  {data.programs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Workout title">
                <input
                  value={workout.title}
                  onChange={(event) =>
                    setWorkout((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Day order">
                <input
                  type="number"
                  min={1}
                  value={workout.dayOrder}
                  onChange={(event) =>
                    setWorkout((current) => ({
                      ...current,
                      dayOrder: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Notes">
                <input
                  value={workout.notes}
                  onChange={(event) =>
                    setWorkout((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={pending || !workout.programId}
              label="Add workout day"
              onClick={() =>
                run("Workout day added.", () =>
                  addProgramWorkout({ clientId: data.client.id, ...workout }),
                )
              }
            />

            <Subhead title="C. Exercise library" />
            <div className={styles.fields}>
              <Field label="Exercise name">
                <input
                  value={exercise.name}
                  onChange={(event) =>
                    setExercise((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Category">
                <input
                  value={exercise.category}
                  onChange={(event) =>
                    setExercise((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Default unit">
                <input
                  value={exercise.defaultUnit}
                  onChange={(event) =>
                    setExercise((current) => ({
                      ...current,
                      defaultUnit: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Instructions">
                <input
                  value={exercise.instructions}
                  onChange={(event) =>
                    setExercise((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={pending}
              label="Add exercise"
              onClick={() =>
                run("Exercise added to the library.", () =>
                  createExercise(exercise),
                )
              }
            />

            <Subhead title="D. Prescribe work" />
            <div className={styles.fields}>
              <Field label="Workout">
                <select
                  value={prescription.workoutId}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      workoutId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose workout</option>
                  {allWorkouts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.programName} · Day {item.dayOrder} · {item.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Exercise">
                <select
                  value={prescription.exerciseId}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      exerciseId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose exercise</option>
                  {data.exercises.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Order">
                <input
                  type="number"
                  value={prescription.orderIndex}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      orderIndex: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Sets">
                <input
                  type="number"
                  value={prescription.sets}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      sets: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Reps">
                <input
                  value={prescription.reps}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      reps: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Target load">
                <input
                  type="number"
                  value={prescription.targetLoad}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      targetLoad: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Unit">
                <input
                  value={prescription.loadUnit}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      loadUnit: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Rest seconds">
                <input
                  type="number"
                  value={prescription.restSeconds}
                  onChange={(event) =>
                    setPrescription((current) => ({
                      ...current,
                      restSeconds: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={
                pending || !prescription.workoutId || !prescription.exerciseId
              }
              label="Prescribe exercise"
              onClick={() =>
                run("Exercise prescribed.", () =>
                  addWorkoutExercise({
                    clientId: data.client.id,
                    ...prescription,
                  }),
                )
              }
            />
          </article>
          <aside className={styles.board}>
            <PanelHead
              icon={<Dumbbell />}
              step="Current architecture"
              title={`${data.programs.length} programs`}
            />
            {data.programs.length ? (
              <ol>
                {data.programs.map((item) => (
                  <li key={item.id}>
                    <span>{titleCase(item.status)}</span>
                    <strong>{item.name}</strong>
                    <p>{item.goalSummary || "No goal summary"}</p>
                    <small>
                      {item.workouts.length} workout days ·{" "}
                      {formatDate(item.startsAt)}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty label="No programs yet" />
            )}
          </aside>
        </section>
      ) : null}

      {phase === "delivery" ? (
        <section className={styles.split}>
          <article className={styles.panel}>
            <PanelHead
              icon={<Activity />}
              step="04 / Delivery"
              title="Log work and measurement"
              description="Capture what happened, then add the number that changed."
            />
            <Subhead title="Delivered set" />
            <div className={styles.fields}>
              <Field label="Workout">
                <select
                  value={performance.workoutId}
                  onChange={(event) => {
                    const selected = allWorkouts.find(
                      (item) => item.id === event.target.value,
                    );
                    setPerformance((current) => ({
                      ...current,
                      workoutId: event.target.value,
                      exerciseId: selected?.exercises[0]?.exercise.id ?? "",
                    }));
                  }}
                >
                  <option value="">Choose workout</option>
                  {allWorkouts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.programName} · {item.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Exercise">
                <select
                  value={performance.exerciseId}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      exerciseId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose exercise</option>
                  {allWorkouts
                    .find((item) => item.id === performance.workoutId)
                    ?.exercises.map((item) => (
                      <option key={item.exercise.id} value={item.exercise.id}>
                        {item.exercise.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Set">
                <input
                  type="number"
                  value={performance.setNumber}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      setNumber: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Reps">
                <input
                  type="number"
                  value={performance.reps}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      reps: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Load">
                <input
                  type="number"
                  value={performance.load}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      load: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Unit">
                <input
                  value={performance.loadUnit}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      loadUnit: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Set RPE">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={performance.rpe}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      rpe: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Duration minutes">
                <input
                  type="number"
                  value={performance.durationMinutes}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      durationMinutes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Session RPE">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={performance.sessionRpe}
                  onChange={(event) =>
                    setPerformance((current) => ({
                      ...current,
                      sessionRpe: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={
                pending || !performance.workoutId || !performance.exerciseId
              }
              label="Log performance"
              onClick={() =>
                run("Performance logged.", () =>
                  recordWorkoutPerformance({
                    clientId: data.client.id,
                    ...performance,
                  }),
                )
              }
            />
            <Subhead title="Progress measurement" />
            <div className={styles.fields}>
              <Field label="Metric">
                <input
                  value={metric.metricType}
                  onChange={(event) =>
                    setMetric((current) => ({
                      ...current,
                      metricType: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Value">
                <input
                  type="number"
                  value={metric.value}
                  onChange={(event) =>
                    setMetric((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Unit">
                <input
                  value={metric.unit}
                  onChange={(event) =>
                    setMetric((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Note">
                <input
                  value={metric.note}
                  onChange={(event) =>
                    setMetric((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <ActionButton
              pending={pending}
              label="Add measurement"
              onClick={() =>
                run("Progress metric recorded.", () =>
                  addProgressMetric({ clientId: data.client.id, ...metric }),
                )
              }
            />
          </article>
          <aside className={styles.board}>
            <PanelHead
              icon={<TrendingUp />}
              step="Evidence stream"
              title="Recent delivery"
            />
            {data.workoutLogs.length ? (
              <ol>
                {data.workoutLogs.slice(0, 6).map((log) => (
                  <li key={log.id}>
                    <span>{formatDate(log.performedAt)}</span>
                    <strong>{log.workoutTitle}</strong>
                    <b>Session RPE {log.sessionRpe ?? "—"}</b>
                    {log.sets.slice(0, 2).map((set) => (
                      <small key={set.id}>
                        {set.exerciseName}: {set.reps ?? "—"} ×{" "}
                        {set.load ?? "—"} {set.loadUnit}
                      </small>
                    ))}
                  </li>
                ))}
              </ol>
            ) : (
              <Empty label="No delivered work yet" />
            )}
            <Subhead title={`${data.metrics.length} measurements`} />
            {data.metrics.slice(0, 5).map((item) => (
              <div className={styles.metricRow} key={item.id}>
                <span>{titleCase(item.metricType)}</span>
                <strong>
                  {item.value} {item.unit}
                </strong>
                <small>{formatDate(item.measuredAt)}</small>
              </div>
            ))}
          </aside>
        </section>
      ) : null}

      {phase === "readiness" ? (
        <section className={styles.panel}>
          <PanelHead
            icon={<HeartPulse />}
            step="05 / Readiness"
            title="Respond before the next load"
            description="Pain, low energy and unanswered context belong at the front of the plan."
          />
          {data.checkIns.length ? (
            <div className={styles.checkIns}>
              {data.checkIns.map((item) => (
                <article
                  key={item.id}
                  data-alert={item.painPresent || undefined}
                >
                  <header>
                    <div>
                      <span>{formatDate(item.submittedAt)}</span>
                      <h3>
                        {item.painPresent
                          ? "Pain flag"
                          : item.coachResponse
                            ? "Response complete"
                            : "Response needed"}
                      </h3>
                    </div>
                    <b>
                      {item.painPresent
                        ? "Priority"
                        : item.coachResponse
                          ? "Closed"
                          : "Open"}
                    </b>
                  </header>
                  <div className={styles.readinessScores}>
                    <span>
                      Sleep <strong>{item.sleepQuality}/5</strong>
                    </span>
                    <span>
                      Energy <strong>{item.energyLevel}/5</strong>
                    </span>
                    <span>
                      Soreness <strong>{item.sorenessLevel}/5</strong>
                    </span>
                    <span>
                      Stress <strong>{item.stressLevel}/5</strong>
                    </span>
                  </div>
                  {item.painDetails ? (
                    <p>
                      <strong>Pain:</strong> {item.painDetails}
                    </p>
                  ) : null}
                  {item.memberNote ? (
                    <p>
                      <strong>Member:</strong> {item.memberNote}
                    </p>
                  ) : null}
                  {item.coachResponse ? (
                    <p className={styles.response}>
                      <strong>Coach:</strong> {item.coachResponse}
                    </p>
                  ) : (
                    <div className={styles.reply}>
                      <Field label="Coach response">
                        <textarea
                          rows={3}
                          value={responses[item.id] ?? ""}
                          onChange={(event) =>
                            setResponses((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                        />
                      </Field>
                      <ActionButton
                        pending={pending}
                        label="Send response"
                        onClick={() =>
                          run("Check-in response saved.", () =>
                            respondToClientCheckIn({
                              clientId: data.client.id,
                              checkInId: item.id,
                              coachResponse: responses[item.id] ?? "",
                            }),
                          )
                        }
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty label="No member check-ins yet" />
          )}
        </section>
      ) : null}
    </div>
  );
}

function PanelHead({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description?: string;
}) {
  return (
    <header className={styles.panelHead}>
      <div>
        <span className={styles.kicker}>{step}</span>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {icon}
    </header>
  );
}
function Subhead({ title }: { title: string }) {
  return <h3 className={styles.subhead}>{title}</h3>;
}
function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? styles.wide : undefined}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function ActionButton({
  pending,
  label,
  onClick,
}: {
  pending: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="mv-btn mv-btn-primary"
      disabled={pending}
      onClick={onClick}
    >
      {label.includes("Save") || label.includes("Log") ? (
        <Save size={15} />
      ) : (
        <Plus size={15} />
      )}
      {label}
    </button>
  );
}
function Empty({ label }: { label: string }) {
  return (
    <div className={styles.empty}>
      <FlaskConical size={24} />
      <strong>{label}</strong>
    </div>
  );
}
