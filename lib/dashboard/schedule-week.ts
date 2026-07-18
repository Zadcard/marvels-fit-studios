import {
  addStudioDays,
  normalizeStudioDateKey,
  studioDateKeyAnchor,
} from "@/lib/time/studio-time";

const weekDayIndex: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export function parseScheduleReference(value: string | undefined, now = new Date()) {
  return normalizeStudioDateKey(value, now);
}

export function getScheduleWeekStart(reference: string, startDay: string) {
  const result = studioDateKeyAnchor(reference);
  const desiredDay = weekDayIndex[startDay] ?? weekDayIndex.Monday;
  const daysSinceStart = (result.getUTCDay() - desiredDay + 7) % 7;
  return addStudioDays(reference, -daysSinceStart);
}
