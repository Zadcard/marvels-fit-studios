"use client";

import { Plus, Trash2 } from "lucide-react";
import type { RecurringSessionTemplateSlot } from "@/lib/dashboard/recurring-session-template";
import styles from "./series-slots-editor.module.css";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function nextDefaultSlot(existing: RecurringSessionTemplateSlot[]): RecurringSessionTemplateSlot {
  const usedWeekdays = new Set(existing.map((slot) => slot.weekday));
  const weekday = [1, 2, 3, 4, 5, 0, 6].find((day) => !usedWeekdays.has(day)) ?? 1;
  return { weekday, localStartTime: "18:00" };
}

export function SeriesSlotsEditor({
  slots,
  onChange,
}: {
  slots: RecurringSessionTemplateSlot[];
  onChange: (slots: RecurringSessionTemplateSlot[]) => void;
}) {
  function updateSlot(index: number, patch: Partial<RecurringSessionTemplateSlot>) {
    onChange(slots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    if (slots.length >= 7) return;
    onChange([...slots, nextDefaultSlot(slots)]);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, slotIndex) => slotIndex !== index));
  }

  return (
    <div className={styles.editor}>
      {slots.map((slot, index) => (
        <div className={styles.row} key={index}>
          <select
            value={slot.weekday}
            onChange={(event) => updateSlot(index, { weekday: Number(event.target.value) })}
          >
            {weekdays.map((day, dayIndex) => (
              <option key={day} value={dayIndex}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            required
            value={slot.localStartTime}
            onChange={(event) => updateSlot(index, { localStartTime: event.target.value })}
          />
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => removeSlot(index)}
            disabled={slots.length <= 1}
            aria-label="Remove day"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={addSlot} disabled={slots.length >= 7}>
        <Plus size={14} /> Add day
      </button>
    </div>
  );
}
