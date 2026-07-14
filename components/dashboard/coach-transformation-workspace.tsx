"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save } from "lucide-react";

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
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFormSection } from "@/components/dashboard/dashboard-form-section";
import { DashboardMiniStat } from "@/components/dashboard/dashboard-mini-stat";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import type { ClientTransformationData } from "@/lib/dashboard/client-transformation";

type CoachTransformationWorkspaceProps = {
  data: ClientTransformationData;
};

const today = new Date().toISOString().slice(0, 10);

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

export function CoachTransformationWorkspace({
  data,
}: CoachTransformationWorkspaceProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [message, setMessage] = useState("Choose the next coaching action.");
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
        item.workouts.map((entry) => ({
          ...entry,
          programName: item.name,
        }))
      ),
    [data.programs]
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

  const runAction = (successMessage: string, action: () => Promise<unknown>) => {
    setMessage("");
    startTransition(async () => {
      try {
        await action();
        setMessage(successMessage);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Action failed.");
      }
    });
  };

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Coach transformation"
        actions={
          <Link href="/coach/clients" className="mv-btn mv-btn-outline">
            <ArrowLeft size={16} />
            Back to clients
          </Link>
        }
      />

      <section className="dashboard-panel dashboard-panel--accent dashboard-panel--dense">
        <div className="dashboard-panel__header">
          <div>
            <div className="mv-eyebrow">Member outcome</div>
            <h2>{data.client.fullName}</h2>
            <p>
              Assessment, goals, prescribed work, delivered performance, and
              check-ins in one coaching record.
            </p>
          </div>
          <DashboardStatusBadge
            label={activeProgram ? titleCase(activeProgram.status) : "No program"}
            tone={activeProgram?.status === "ACTIVE" ? "success" : "warning"}
          />
        </div>
        <div className="dashboard-mini-grid">
          <DashboardMiniStat
            label="Assessment"
            value={data.assessment ? titleCase(data.assessment.status) : "Missing"}
            description={data.assessment?.primaryGoal ?? "Complete the baseline first."}
          />
          <DashboardMiniStat
            label="Active goals"
            value={String(data.goals.filter((item) => item.status === "ACTIVE").length)}
            description={`${data.goals.length} total goal records.`}
          />
          <DashboardMiniStat
            label="Program"
            value={activeProgram?.name ?? "Not assigned"}
            description={`${activeProgram?.workouts.length ?? 0} workout days.`}
          />
          <DashboardMiniStat
            label="Latest check-in"
            value={data.checkIns[0] ? formatDate(data.checkIns[0].submittedAt) : "None"}
            description={
              data.checkIns[0]?.coachResponse
                ? "Coach response complete."
                : "Response may be needed."
            }
          />
        </div>
        <div className="dashboard-info-strip" role="status">
          <strong>Workspace status</strong>
          <p>{message}</p>
        </div>
      </section>

      <DashboardFormSection
        eyebrow="Step 1"
        title="Assessment and safety baseline"
        description="Record experience, intent, limitations, and informed consent before prescribing work."
      >
        <div className="dashboard-form-columns">
          <label className="dashboard-form-field">
            <span>Experience level</span>
            <input
              className="dashboard-input"
              value={assessment.experienceLevel}
              onChange={(event) =>
                setAssessment((current) => ({
                  ...current,
                  experienceLevel: event.target.value,
                }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Status</span>
            <select
              className="dashboard-select"
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
          </label>
        </div>
        <label className="dashboard-form-field dashboard-form-field--wide">
          <span>Primary goal</span>
          <textarea
            className="dashboard-textarea"
            rows={3}
            value={assessment.primaryGoal}
            onChange={(event) =>
              setAssessment((current) => ({ ...current, primaryGoal: event.target.value }))
            }
          />
        </label>
        <div className="dashboard-form-columns">
          <label className="dashboard-form-field">
            <span>Secondary goals</span>
            <textarea
              className="dashboard-textarea"
              rows={4}
              value={assessment.secondaryGoals}
              onChange={(event) =>
                setAssessment((current) => ({ ...current, secondaryGoals: event.target.value }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Injuries or limitations</span>
            <textarea
              className="dashboard-textarea"
              rows={4}
              value={assessment.injuriesLimitations}
              onChange={(event) =>
                setAssessment((current) => ({ ...current, injuriesLimitations: event.target.value }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Medical notes</span>
            <textarea
              className="dashboard-textarea"
              rows={4}
              value={assessment.medicalNotes}
              onChange={(event) =>
                setAssessment((current) => ({ ...current, medicalNotes: event.target.value }))
              }
            />
          </label>
          <label className="dashboard-form-field">
            <span>Baseline summary</span>
            <textarea
              className="dashboard-textarea"
              rows={4}
              value={assessment.baselineSummary}
              onChange={(event) =>
                setAssessment((current) => ({ ...current, baselineSummary: event.target.value }))
              }
            />
          </label>
        </div>
        <label className="dashboard-form-field">
          <span>
            <input
              type="checkbox"
              checked={assessment.consentAcknowledged}
              onChange={(event) =>
                setAssessment((current) => ({
                  ...current,
                  consentAcknowledged: event.target.checked,
                }))
              }
            />{" "}
            Consent and readiness discussion acknowledged
          </span>
        </label>
        <button
          type="button"
          className="mv-btn mv-btn-primary"
          disabled={isSaving}
          onClick={() =>
            runAction("Assessment saved.", () =>
              saveClientAssessment({
                clientId: data.client.id,
                assessmentId: data.assessment?.id,
                ...assessment,
              })
            )
          }
        >
          <Save size={16} />
          Save assessment
        </button>
      </DashboardFormSection>

      <section className="dashboard-detail-layout">
        <DashboardFormSection
          eyebrow="Step 2"
          title="Outcome goals"
          description="Create measurable goals that can be updated as progress is recorded."
        >
          <div className="dashboard-form-columns">
            <label className="dashboard-form-field">
              <span>Goal title</span>
              <input className="dashboard-input" value={goal.title} onChange={(event) => setGoal((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label className="dashboard-form-field">
              <span>Metric</span>
              <input className="dashboard-input" value={goal.metricType} onChange={(event) => setGoal((current) => ({ ...current, metricType: event.target.value }))} placeholder="e.g. deadlift" />
            </label>
            <label className="dashboard-form-field"><span>Baseline</span><input className="dashboard-input" type="number" value={goal.baselineValue} onChange={(event) => setGoal((current) => ({ ...current, baselineValue: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Target</span><input className="dashboard-input" type="number" value={goal.targetValue} onChange={(event) => setGoal((current) => ({ ...current, targetValue: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Current</span><input className="dashboard-input" type="number" value={goal.currentValue} onChange={(event) => setGoal((current) => ({ ...current, currentValue: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Unit</span><input className="dashboard-input" value={goal.unit} onChange={(event) => setGoal((current) => ({ ...current, unit: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Target date</span><input className="dashboard-input" type="date" value={goal.targetDate} onChange={(event) => setGoal((current) => ({ ...current, targetDate: event.target.value }))} /></label>
          </div>
          <label className="dashboard-form-field dashboard-form-field--wide"><span>Description</span><textarea className="dashboard-textarea" rows={3} value={goal.description} onChange={(event) => setGoal((current) => ({ ...current, description: event.target.value }))} /></label>
          <button type="button" className="mv-btn mv-btn-primary" disabled={isSaving} onClick={() => runAction("Goal added.", () => saveClientGoal({ clientId: data.client.id, ...goal }))}>
            <Plus size={16} /> Add goal
          </button>
        </DashboardFormSection>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header"><div><div className="mv-eyebrow">Goal board</div><h2>{data.goals.length} goals</h2></div></div>
          {data.goals.length ? <div className="dashboard-summary-list">{data.goals.map((item) => <div key={item.id} className="dashboard-summary-row"><strong>{item.title}</strong><span>{item.currentValue ?? "-"} / {item.targetValue ?? "-"} {item.unit}</span><small>{titleCase(item.status)}{item.targetDate ? ` · ${formatDate(item.targetDate)}` : ""}</small></div>)}</div> : <DashboardEmptyState title="No goals yet" description="Add the first measurable outcome." />}
        </aside>
      </section>

      <DashboardFormSection eyebrow="Step 3" title="Program and workout prescription" description="Create a program, add workout days, maintain the exercise library, and prescribe work.">
        <div className="dashboard-form-columns">
          <label className="dashboard-form-field"><span>Program name</span><input className="dashboard-input" value={program.name} onChange={(event) => setProgram((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Status</span><select className="dashboard-select" value={program.status} onChange={(event) => setProgram((current) => ({ ...current, status: event.target.value as typeof current.status }))}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></label>
          <label className="dashboard-form-field"><span>Starts</span><input className="dashboard-input" type="date" value={program.startsAt} onChange={(event) => setProgram((current) => ({ ...current, startsAt: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Ends</span><input className="dashboard-input" type="date" value={program.endsAt} onChange={(event) => setProgram((current) => ({ ...current, endsAt: event.target.value }))} /></label>
        </div>
        <label className="dashboard-form-field dashboard-form-field--wide"><span>Goal summary</span><textarea className="dashboard-textarea" rows={3} value={program.goalSummary} onChange={(event) => setProgram((current) => ({ ...current, goalSummary: event.target.value }))} /></label>
        <button type="button" className="mv-btn mv-btn-primary" disabled={isSaving} onClick={() => runAction("Program saved.", () => saveTrainingProgram({ clientId: data.client.id, ...program }))}><Save size={16} /> Save new program</button>

        <div className="dashboard-form-columns">
          <label className="dashboard-form-field"><span>Program</span><select className="dashboard-select" value={workout.programId} onChange={(event) => setWorkout((current) => ({ ...current, programId: event.target.value }))}><option value="">Choose program</option>{data.programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="dashboard-form-field"><span>Workout title</span><input className="dashboard-input" value={workout.title} onChange={(event) => setWorkout((current) => ({ ...current, title: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Day order</span><input className="dashboard-input" type="number" min={1} value={workout.dayOrder} onChange={(event) => setWorkout((current) => ({ ...current, dayOrder: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Notes</span><input className="dashboard-input" value={workout.notes} onChange={(event) => setWorkout((current) => ({ ...current, notes: event.target.value }))} /></label>
        </div>
        <button type="button" className="mv-btn mv-btn-secondary" disabled={isSaving || !workout.programId} onClick={() => runAction("Workout day added.", () => addProgramWorkout({ clientId: data.client.id, ...workout }))}><Plus size={16} /> Add workout day</button>

        <div className="dashboard-form-columns">
          <label className="dashboard-form-field"><span>New exercise</span><input className="dashboard-input" value={exercise.name} onChange={(event) => setExercise((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Category</span><input className="dashboard-input" value={exercise.category} onChange={(event) => setExercise((current) => ({ ...current, category: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Default unit</span><input className="dashboard-input" value={exercise.defaultUnit} onChange={(event) => setExercise((current) => ({ ...current, defaultUnit: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Instructions</span><input className="dashboard-input" value={exercise.instructions} onChange={(event) => setExercise((current) => ({ ...current, instructions: event.target.value }))} /></label>
        </div>
        <button type="button" className="mv-btn mv-btn-outline" disabled={isSaving} onClick={() => runAction("Exercise added to the library.", () => createExercise(exercise))}><Plus size={16} /> Add exercise</button>

        <div className="dashboard-form-columns">
          <label className="dashboard-form-field"><span>Workout</span><select className="dashboard-select" value={prescription.workoutId} onChange={(event) => setPrescription((current) => ({ ...current, workoutId: event.target.value }))}><option value="">Choose workout</option>{allWorkouts.map((item) => <option key={item.id} value={item.id}>{item.programName} · Day {item.dayOrder} · {item.title}</option>)}</select></label>
          <label className="dashboard-form-field"><span>Exercise</span><select className="dashboard-select" value={prescription.exerciseId} onChange={(event) => setPrescription((current) => ({ ...current, exerciseId: event.target.value }))}><option value="">Choose exercise</option>{data.exercises.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="dashboard-form-field"><span>Order</span><input className="dashboard-input" type="number" value={prescription.orderIndex} onChange={(event) => setPrescription((current) => ({ ...current, orderIndex: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Sets</span><input className="dashboard-input" type="number" value={prescription.sets} onChange={(event) => setPrescription((current) => ({ ...current, sets: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Reps</span><input className="dashboard-input" value={prescription.reps} onChange={(event) => setPrescription((current) => ({ ...current, reps: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Target load</span><input className="dashboard-input" type="number" value={prescription.targetLoad} onChange={(event) => setPrescription((current) => ({ ...current, targetLoad: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Unit</span><input className="dashboard-input" value={prescription.loadUnit} onChange={(event) => setPrescription((current) => ({ ...current, loadUnit: event.target.value }))} /></label>
          <label className="dashboard-form-field"><span>Rest seconds</span><input className="dashboard-input" type="number" value={prescription.restSeconds} onChange={(event) => setPrescription((current) => ({ ...current, restSeconds: event.target.value }))} /></label>
        </div>
        <button type="button" className="mv-btn mv-btn-secondary" disabled={isSaving || !prescription.workoutId || !prescription.exerciseId} onClick={() => runAction("Exercise prescribed.", () => addWorkoutExercise({ clientId: data.client.id, ...prescription }))}><Plus size={16} /> Prescribe exercise</button>

        {data.programs.length ? <div className="dashboard-summary-list">{data.programs.map((item) => <div key={item.id} className="dashboard-summary-row"><strong>{item.name} · {titleCase(item.status)}</strong><span>{item.goalSummary || "No goal summary"}</span><small>{item.workouts.length} workout days · {formatDate(item.startsAt)}</small>{item.workouts.map((entry) => <span key={entry.id}>Day {entry.dayOrder}: {entry.title} · {entry.exercises.length} exercises</span>)}</div>)}</div> : null}
      </DashboardFormSection>

      <section className="dashboard-detail-layout">
        <DashboardFormSection eyebrow="Step 4" title="Delivered performance" description="Log an actual set and session effort against prescribed work.">
          <div className="dashboard-form-columns">
            <label className="dashboard-form-field"><span>Workout</span><select className="dashboard-select" value={performance.workoutId} onChange={(event) => { const selected = allWorkouts.find((item) => item.id === event.target.value); setPerformance((current) => ({ ...current, workoutId: event.target.value, exerciseId: selected?.exercises[0]?.exercise.id ?? "" })); }}><option value="">Choose workout</option>{allWorkouts.map((item) => <option key={item.id} value={item.id}>{item.programName} · {item.title}</option>)}</select></label>
            <label className="dashboard-form-field"><span>Exercise</span><select className="dashboard-select" value={performance.exerciseId} onChange={(event) => setPerformance((current) => ({ ...current, exerciseId: event.target.value }))}><option value="">Choose exercise</option>{allWorkouts.find((item) => item.id === performance.workoutId)?.exercises.map((item) => <option key={item.exercise.id} value={item.exercise.id}>{item.exercise.name}</option>)}</select></label>
            <label className="dashboard-form-field"><span>Set</span><input className="dashboard-input" type="number" value={performance.setNumber} onChange={(event) => setPerformance((current) => ({ ...current, setNumber: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Reps</span><input className="dashboard-input" type="number" value={performance.reps} onChange={(event) => setPerformance((current) => ({ ...current, reps: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Load</span><input className="dashboard-input" type="number" value={performance.load} onChange={(event) => setPerformance((current) => ({ ...current, load: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Unit</span><input className="dashboard-input" value={performance.loadUnit} onChange={(event) => setPerformance((current) => ({ ...current, loadUnit: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Set RPE</span><input className="dashboard-input" type="number" min={1} max={10} value={performance.rpe} onChange={(event) => setPerformance((current) => ({ ...current, rpe: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Minutes</span><input className="dashboard-input" type="number" value={performance.durationMinutes} onChange={(event) => setPerformance((current) => ({ ...current, durationMinutes: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Session RPE</span><input className="dashboard-input" type="number" min={1} max={10} value={performance.sessionRpe} onChange={(event) => setPerformance((current) => ({ ...current, sessionRpe: event.target.value }))} /></label>
          </div>
          <button type="button" className="mv-btn mv-btn-primary" disabled={isSaving || !performance.workoutId || !performance.exerciseId} onClick={() => runAction("Performance logged.", () => recordWorkoutPerformance({ clientId: data.client.id, ...performance }))}><Save size={16} /> Log performance</button>
        </DashboardFormSection>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header"><div><div className="mv-eyebrow">Recent delivery</div><h2>{data.workoutLogs.length} workout logs</h2></div></div>
          {data.workoutLogs.length ? <div className="dashboard-summary-list">{data.workoutLogs.slice(0, 6).map((log) => <div key={log.id} className="dashboard-summary-row"><strong>{log.workoutTitle}</strong><span>{formatDate(log.performedAt)} · RPE {log.sessionRpe ?? "-"}</span>{log.sets.map((set) => <small key={set.id}>{set.exerciseName}: {set.reps ?? "-"} reps × {set.load ?? "-"} {set.loadUnit}</small>)}</div>)}</div> : <DashboardEmptyState title="No performance logged" description="Log the first delivered workout above." />}
        </aside>
      </section>

      <section className="dashboard-detail-layout">
        <DashboardFormSection eyebrow="Step 5" title="Progress measurements" description="Record comparable measurements over time.">
          <div className="dashboard-form-columns">
            <label className="dashboard-form-field"><span>Metric</span><input className="dashboard-input" value={metric.metricType} onChange={(event) => setMetric((current) => ({ ...current, metricType: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Value</span><input className="dashboard-input" type="number" value={metric.value} onChange={(event) => setMetric((current) => ({ ...current, value: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Unit</span><input className="dashboard-input" value={metric.unit} onChange={(event) => setMetric((current) => ({ ...current, unit: event.target.value }))} /></label>
            <label className="dashboard-form-field"><span>Note</span><input className="dashboard-input" value={metric.note} onChange={(event) => setMetric((current) => ({ ...current, note: event.target.value }))} /></label>
          </div>
          <button type="button" className="mv-btn mv-btn-primary" disabled={isSaving} onClick={() => runAction("Progress metric recorded.", () => addProgressMetric({ clientId: data.client.id, ...metric }))}><Plus size={16} /> Add measurement</button>
        </DashboardFormSection>

        <aside className="dashboard-panel dashboard-detail-panel">
          <div className="dashboard-panel__header"><div><div className="mv-eyebrow">Progress timeline</div><h2>{data.metrics.length} measurements</h2></div></div>
          {data.metrics.length ? <div className="dashboard-summary-list">{data.metrics.slice(0, 10).map((item) => <div key={item.id} className="dashboard-summary-row"><strong>{titleCase(item.metricType)}</strong><span>{item.value} {item.unit}</span><small>{formatDate(item.measuredAt)}{item.note ? ` · ${item.note}` : ""}</small></div>)}</div> : <DashboardEmptyState title="No measurements" description="Record the first baseline metric." />}
        </aside>
      </section>

      <section className="dashboard-panel dashboard-panel--dense">
        <div className="dashboard-panel__header"><div><div className="mv-eyebrow">Member check-ins</div><h2>Readiness and coach responses</h2><p>Prioritize pain, low energy, high soreness, and unanswered notes.</p></div></div>
        {data.checkIns.length ? <div className="dashboard-stack">{data.checkIns.map((item) => <article key={item.id} className="dashboard-form-section"><div className="dashboard-form-section__header"><div><h3>{formatDate(item.submittedAt)}</h3><p>Sleep {item.sleepQuality}/5 · Energy {item.energyLevel}/5 · Soreness {item.sorenessLevel}/5 · Stress {item.stressLevel}/5</p></div><DashboardStatusBadge label={item.painPresent ? "Pain flagged" : item.coachResponse ? "Responded" : "Needs response"} tone={item.painPresent ? "warning" : item.coachResponse ? "success" : "accent"} /></div>{item.painDetails ? <p><strong>Pain:</strong> {item.painDetails}</p> : null}{item.memberNote ? <p><strong>Member:</strong> {item.memberNote}</p> : null}{item.coachResponse ? <p><strong>Coach:</strong> {item.coachResponse}</p> : <><label className="dashboard-form-field"><span>Coach response</span><textarea className="dashboard-textarea" rows={3} value={responses[item.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} /></label><button type="button" className="mv-btn mv-btn-primary" disabled={isSaving} onClick={() => runAction("Check-in response saved.", () => respondToClientCheckIn({ clientId: data.client.id, checkInId: item.id, coachResponse: responses[item.id] ?? "" }))}>Respond</button></>}</article>)}</div> : <DashboardEmptyState title="No check-ins yet" description="The member's first check-in will appear here." />}
      </section>
    </div>
  );
}
