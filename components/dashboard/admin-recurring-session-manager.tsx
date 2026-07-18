"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarRange, Pause, Play, Plus, Repeat2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";

import {
  deleteRecurringSessionTemplate,
  generateRecurringSessions,
  saveRecurringSessionTemplate,
  setRecurringTemplateActive,
} from "@/app/actions/admin-recurring-sessions";
import type { RecurringSessionTemplateRecord } from "@/lib/dashboard/recurring-session-template";
import type {
  AdminScheduleGroupOption,
} from "@/lib/repositories/admin-schedule-repository";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";
import { addStudioDays, getStudioDateKey } from "@/lib/time/studio-time";
import styles from "./admin-recurring-session-manager.module.css";

type FormState = {
  title: string;
  description: string;
  type: "GROUP" | "PRIVATE";
  coachId: string;
  groupId: string;
  location: string;
  capacity: string;
  weekday: string;
  localStartTime: string;
  durationMinutes: string;
  startsOn: string;
  endsOn: string;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function emptyForm(coachId = "", defaultDurationMinutes = 60): FormState {
  return {
    title: "",
    description: "",
    type: "GROUP",
    coachId,
    groupId: "",
    location: "",
    capacity: "12",
    weekday: "1",
    localStartTime: "18:00",
    durationMinutes: String(defaultDurationMinutes),
    startsOn: getStudioDateKey(),
    endsOn: "",
  };
}

function formFor(template: RecurringSessionTemplateRecord): FormState {
  return {
    title: template.title,
    description: template.description,
    type: template.type,
    coachId: template.coachId,
    groupId: template.groupId ?? "",
    location: template.location,
    capacity: String(template.capacity),
    weekday: String(template.weekday),
    localStartTime: template.localStartTime,
    durationMinutes: String(template.durationMinutes),
    startsOn: template.startsOn,
    endsOn: template.endsOn,
  };
}

function defaultThroughDate() {
  return addStudioDays(getStudioDateKey(), 28);
}

export function AdminRecurringSessionManager({
  templates,
  coachOptions,
  groupOptions,
  defaultDurationMinutes = 60,
}: {
  templates: RecurringSessionTemplateRecord[];
  coachOptions: AdminSessionCoachOption[];
  groupOptions: AdminScheduleGroupOption[];
  defaultDurationMinutes?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const selected = templates.find((template) => template.id === selectedId) ?? null;
  const [form, setForm] = useState<FormState>(() =>
    selected ? formFor(selected) : emptyForm(coachOptions[0]?.id, defaultDurationMinutes),
  );
  const [throughDate, setThroughDate] = useState(defaultThroughDate);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function choose(template: RecurringSessionTemplateRecord) {
    setSelectedId(template.id);
    setForm(formFor(template));
    setMessage("");
  }

  function createNew() {
    setSelectedId(null);
    setForm(emptyForm(coachOptions[0]?.id, defaultDurationMinutes));
    setMessage("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveRecurringSessionTemplate({
          templateId: selectedId,
          title: form.title,
          description: form.description,
          type: form.type,
          coachId: form.coachId,
          groupId: form.groupId || undefined,
          location: form.location,
          capacity: form.type === "PRIVATE" ? 1 : Number(form.capacity),
          weekday: Number(form.weekday),
          localStartTime: form.localStartTime,
          durationMinutes: Number(form.durationMinutes),
          startsOn: form.startsOn,
          endsOn: form.endsOn || undefined,
        });
        setSelectedId(result.id);
        setMessage(selectedId ? "Series updated. Existing occurrences were not changed." : "Recurring series created.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not save the recurring series.");
      }
    });
  }

  function toggleActive() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      try {
        await setRecurringTemplateActive(selected.id, !selected.active);
        setMessage(selected.active ? "Series paused." : "Series resumed.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not update the series.");
      }
    });
  }

  function generate() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await generateRecurringSessions({ templateId: selected.id, throughDate });
        setMessage(`${result.generated} new occurrence${result.generated === 1 ? "" : "s"} generated.`);
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not generate occurrences.");
      }
    });
  }

  function remove() {
    if (!selected) return;
    setMessage("");
    startTransition(async () => {
      try {
        await deleteRecurringSessionTemplate(selected.id);
        setSelectedId(null);
        setForm(emptyForm(coachOptions[0]?.id, defaultDurationMinutes));
        setMessage("Recurring series deleted.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not delete the series.");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild><button type="button" className="mv-btn mv-btn-secondary"><Repeat2 size={16} /> Recurring series</button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <Dialog.Title>Recurring series</Dialog.Title>
          <Dialog.Description>Create and manage templates. Edits affect only occurrences generated afterward.</Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="Close recurring series"><X size={18} /></Dialog.Close>
          <div className={styles.layout} aria-busy={pending}>
            <aside className={styles.list}>
              <button type="button" className={styles.newButton} onClick={createNew}><Plus size={15} /> New series</button>
              {templates.map((template) => <button type="button" key={template.id} data-active={selectedId === template.id || undefined} onClick={() => choose(template)}><strong>{template.title}</strong><span>{weekdays[template.weekday]} · {template.localStartTime} · {template.coachName}</span><small>{template.active ? "Active" : "Paused"}</small></button>)}
            </aside>
            <form className={styles.form} onSubmit={submit}>
              <label className={styles.full}>Series title<input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></label>
              <label className={styles.full}>Description<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
              <label>Type<select value={form.type} onChange={(event) => setForm((value) => ({ ...value, type: event.target.value as FormState["type"] }))}><option value="GROUP">Group</option><option value="PRIVATE">Private</option></select></label>
              <label>Coach<select required value={form.coachId} onChange={(event) => setForm((value) => ({ ...value, coachId: event.target.value }))}><option value="">Select coach</option>{coachOptions.map((coach) => <option key={coach.id} value={coach.id}>{coach.fullName}</option>)}</select></label>
              <label>Group<select value={form.groupId} onChange={(event) => setForm((value) => ({ ...value, groupId: event.target.value }))}><option value="">No linked group</option>{groupOptions.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
              <label>Location<input value={form.location} onChange={(event) => setForm((value) => ({ ...value, location: event.target.value }))} /></label>
              <label>Weekday<select value={form.weekday} onChange={(event) => setForm((value) => ({ ...value, weekday: event.target.value }))}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
              <label>Start time<input type="time" required value={form.localStartTime} onChange={(event) => setForm((value) => ({ ...value, localStartTime: event.target.value }))} /></label>
              <label>Duration minutes<input type="number" min="15" max="480" required value={form.durationMinutes} onChange={(event) => setForm((value) => ({ ...value, durationMinutes: event.target.value }))} /></label>
              <label>Capacity<input type="number" min="1" max="100" disabled={form.type === "PRIVATE"} value={form.type === "PRIVATE" ? "1" : form.capacity} onChange={(event) => setForm((value) => ({ ...value, capacity: event.target.value }))} /></label>
              <label>Starts on<input type="date" required value={form.startsOn} onChange={(event) => setForm((value) => ({ ...value, startsOn: event.target.value }))} /></label>
              <label>Ends on<input type="date" value={form.endsOn} onChange={(event) => setForm((value) => ({ ...value, endsOn: event.target.value }))} /></label>
              {selected ? <section className={`${styles.generate} ${styles.full}`}><label>Generate through<input type="date" min={selected.startsOn} value={throughDate} onChange={(event) => setThroughDate(event.target.value)} /></label><button type="button" onClick={generate} disabled={pending}><CalendarRange size={15} /> Generate</button><button type="button" onClick={toggleActive} disabled={pending}>{selected.active ? <Pause size={15} /> : <Play size={15} />}{selected.active ? "Pause" : "Resume"}</button><button type="button" className={styles.deleteButton} onClick={remove} disabled={pending}><Trash2 size={15} /> Delete</button></section> : null}
              {message ? <p className={`${styles.message} ${styles.full}`} role="status">{message}</p> : null}
              <footer className={styles.full}><button type="button" className="mv-btn mv-btn-secondary" onClick={() => setOpen(false)}>Close</button><button type="submit" className="mv-btn mv-btn-primary" disabled={pending}>{pending ? "Saving…" : selectedId ? "Save future pattern" : "Create series"}</button></footer>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
