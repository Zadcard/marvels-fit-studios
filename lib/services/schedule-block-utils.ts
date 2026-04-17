import { ScheduleDay } from "@prisma/client";

export const scheduleDayOrder: ScheduleDay[] = [
  ScheduleDay.SUNDAY,
  ScheduleDay.MONDAY,
  ScheduleDay.TUESDAY,
  ScheduleDay.WEDNESDAY,
  ScheduleDay.THURSDAY,
  ScheduleDay.FRIDAY,
  ScheduleDay.SATURDAY,
];

const scheduleDayIndex = new Map(
  scheduleDayOrder.map((day, index) => [day, index])
);

export type ScheduleBlockOccurrence = {
  startsAt: Date;
  endsAt: Date;
};

export function getScheduleDayLabel(day: ScheduleDay) {
  return `${day.charAt(0)}${day.slice(1).toLowerCase()}`;
}

export function formatRecurrenceSummary(days: ScheduleDay[]) {
  return days
    .slice()
    .sort(
      (left, right) =>
        (scheduleDayIndex.get(left) ?? 0) - (scheduleDayIndex.get(right) ?? 0)
    )
    .map(getScheduleDayLabel)
    .join(", ");
}

export function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Time must use HH:MM format.");
  }

  return hours * 60 + minutes;
}

export function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );
}

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

export function buildWeeklyOccurrences(input: {
  startsOn: Date;
  endsOn: Date;
  recurrenceDays: ScheduleDay[];
  startTime: string;
  endTime: string;
}) {
  const rangeStart = startOfLocalDay(input.startsOn);
  const rangeEnd = startOfLocalDay(input.endsOn);
  const recurrenceDaySet = new Set(input.recurrenceDays);
  const occurrences: ScheduleBlockOccurrence[] = [];

  if (rangeEnd < rangeStart) {
    throw new Error("End date must be on or after the start date.");
  }

  parseTimeToMinutes(input.startTime);
  parseTimeToMinutes(input.endTime);

  let cursor = rangeStart;

  while (cursor <= rangeEnd) {
    const weekday = scheduleDayOrder[cursor.getDay()];

    if (weekday && recurrenceDaySet.has(weekday)) {
      const startsAt = combineDateAndTime(cursor, input.startTime);
      const endsAt = combineDateAndTime(cursor, input.endTime);

      if (endsAt <= startsAt) {
        throw new Error("End time must be after start time.");
      }

      occurrences.push({ startsAt, endsAt });
    }

    cursor = addDays(cursor, 1);
  }

  return occurrences;
}

export function rangesOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date
) {
  return leftStart < rightEnd && rightStart < leftEnd;
}
