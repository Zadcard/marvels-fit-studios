"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createRecurringSessionTemplate,
  generateRecurringSessions,
  setRecurringTemplateActive,
} from "@/app/actions/admin-recurring-sessions";
import type { Database } from "@/lib/supabase/database.types";

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
  const run = (work: () => Promise<unknown>, success: string) => {
    setError(""); setMessage("");
    startTransition(async () => {
      try { await work(); setMessage(success); router.refresh(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed."); }
    });
  };

  return <div className="dashboard-page-stack">
    <section className="dashboard-page-heading">
      <div><div className="mv-eyebrow">Calendar automation</div><h1>Recurring session templates</h1><p>Create a weekly rule, then generate idempotent schedule occurrences through any date.</p></div>
      <Link className="mv-btn mv-btn-outline" href="/admin/schedule">Back to Calendar</Link>
    </section>

    {(error || message) ? <div className="dashboard-empty-state" role="status"><strong>{error ? "Action stopped" : "Complete"}</strong><p>{error || message}</p></div> : null}

    <section className="dashboard-panel dashboard-panel--dense">
      <div className="dashboard-panel__header"><div><div className="mv-eyebrow">New weekly rule</div><h2>Create template</h2></div></div>
      <form className="dashboard-form-grid" onSubmit={(event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        run(() => createRecurringSessionTemplate({
          title: String(form.get("title")), description: String(form.get("description")),
          type: String(form.get("type")) as "GROUP" | "PRIVATE", coachId: String(form.get("coachId")),
          groupId: String(form.get("groupId")), location: String(form.get("location")),
          capacity: Number(form.get("capacity")), weekday: Number(form.get("weekday")),
          localStartTime: String(form.get("localStartTime")), durationMinutes: Number(form.get("durationMinutes")),
          startsOn: String(form.get("startsOn")), endsOn: String(form.get("endsOn")),
        }), "Template created.");
      }}>
        <label className="dashboard-form-field"><span>Title</span><input className="dashboard-input" name="title" required minLength={2} /></label>
        <label className="dashboard-form-field"><span>Coach</span><select className="dashboard-select" name="coachId" required>{coaches.map(coach => <option key={coach.id} value={coach.id}>{coach.fullName}</option>)}</select></label>
        <label className="dashboard-form-field"><span>Type</span><select className="dashboard-select" name="type"><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label>
        <label className="dashboard-form-field"><span>Group (optional)</span><select className="dashboard-select" name="groupId"><option value="">No group</option>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
        <label className="dashboard-form-field"><span>Weekday</span><select className="dashboard-select" name="weekday">{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        <label className="dashboard-form-field"><span>Start time</span><input className="dashboard-input" name="localStartTime" type="time" defaultValue="18:00" required /></label>
        <label className="dashboard-form-field"><span>Duration (minutes)</span><input className="dashboard-input" name="durationMinutes" type="number" min="15" max="480" defaultValue="60" required /></label>
        <label className="dashboard-form-field"><span>Capacity</span><input className="dashboard-input" name="capacity" type="number" min="1" max="100" defaultValue="12" required /></label>
        <label className="dashboard-form-field"><span>Starts on</span><input className="dashboard-input" name="startsOn" type="date" required /></label>
        <label className="dashboard-form-field"><span>Ends on (optional)</span><input className="dashboard-input" name="endsOn" type="date" /></label>
        <label className="dashboard-form-field"><span>Location</span><input className="dashboard-input" name="location" /></label>
        <label className="dashboard-form-field"><span>Description</span><input className="dashboard-input" name="description" /></label>
        <div className="dashboard-row-actions"><button className="mv-btn mv-btn-primary" disabled={pending || coaches.length === 0}>Create template</button></div>
      </form>
    </section>

    <section className="dashboard-panel dashboard-panel--dense">
      <div className="dashboard-panel__header"><div><div className="mv-eyebrow">Weekly rules</div><h2>{templates.length} templates</h2></div></div>
      <div className="dashboard-summary-list">{templates.map(template => <div className="dashboard-summary-row" key={template.id}>
        <div><strong>{template.title}</strong><span>{weekdays[template.weekday]} at {template.localStartTime.slice(0, 5)} · {template.coach.fullName} · {template.group?.name ?? "No group"} · {template.active ? "Active" : "Paused"}</span><small>Generated through {template.lastGeneratedThrough ?? "not yet generated"}</small></div>
        <form onSubmit={(event) => { event.preventDefault(); const throughDate = String(new FormData(event.currentTarget).get("throughDate")); run(() => generateRecurringSessions({ templateId: template.id, throughDate }), "Schedule generated."); }} className="dashboard-row-actions">
          <input className="dashboard-input" name="throughDate" type="date" required />
          <button className="mv-btn mv-btn-primary" disabled={pending || !template.active}>Generate</button>
          <button type="button" className="mv-btn mv-btn-outline" disabled={pending} onClick={() => run(() => setRecurringTemplateActive(template.id, !template.active), template.active ? "Template paused." : "Template activated.")}>{template.active ? "Pause" : "Activate"}</button>
        </form>
      </div>)}</div>
    </section>
  </div>;
}
