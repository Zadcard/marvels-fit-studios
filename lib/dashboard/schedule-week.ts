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
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(now);
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(now) : parsed;
}

export function getScheduleWeekStart(reference: Date, startDay: string) {
  const result = new Date(reference);
  result.setHours(0, 0, 0, 0);
  const desiredDay = weekDayIndex[startDay] ?? weekDayIndex.Monday;
  const daysSinceStart = (result.getDay() - desiredDay + 7) % 7;
  result.setDate(result.getDate() - daysSinceStart);
  return result;
}
