export const STUDIO_TIME_ZONE = "Africa/Cairo";

const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimeLocalPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const zonedPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zonedParts(value: Date): ZonedParts {
  const parts = zonedPartsFormatter.formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

function parseDateKey(value: string) {
  const match = dateKeyPattern.exec(value);
  if (!match) throw new Error("A valid studio date is required.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error("A valid studio date is required.");
  }
  return { year, month, day };
}

function timeZoneOffsetMs(value: Date) {
  const parts = zonedParts(value);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const valueToSecond = Math.trunc(value.getTime() / 1000) * 1000;
  return representedAsUtc - valueToSecond;
}

function studioLocalPartsToInstant(parts: ZonedParts) {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const firstGuess = new Date(localAsUtc);
  let result = new Date(localAsUtc - timeZoneOffsetMs(firstGuess));
  const correctedOffset = timeZoneOffsetMs(result);
  result = new Date(localAsUtc - correctedOffset);

  const roundTrip = zonedParts(result);
  if (Object.keys(parts).some((key) => roundTrip[key as keyof ZonedParts] !== parts[key as keyof ZonedParts])) {
    throw new Error("That local studio time does not exist in Africa/Cairo.");
  }
  return result;
}

export function getStudioDateKey(value = new Date()) {
  const parts = zonedParts(value);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

export function normalizeStudioDateKey(
  value: string | undefined,
  now = new Date(),
) {
  if (!value) return getStudioDateKey(now);
  try {
    parseDateKey(value);
    return value;
  } catch {
    return getStudioDateKey(now);
  }
}

export function addStudioDays(dateKey: string, days: number) {
  const parts = parseDateKey(dateKey);
  const result = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${result.getUTCFullYear().toString().padStart(4, "0")}-${(
    result.getUTCMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${result.getUTCDate().toString().padStart(2, "0")}`;
}

export function studioDateKeyAnchor(dateKey: string) {
  const parts = parseDateKey(dateKey);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

export function studioDateTimeLocalToIso(value: string) {
  const match = dateTimeLocalPattern.exec(value);
  if (!match) throw new Error("A valid studio date and time is required.");
  const parts: ZonedParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  parseDateKey(
    `${match[1]}-${match[2]}-${match[3]}`,
  );
  if (parts.hour > 23 || parts.minute > 59 || parts.second > 59) {
    throw new Error("A valid studio date and time is required.");
  }
  return studioLocalPartsToInstant(parts).toISOString();
}

export function instantToStudioDateTimeLocal(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("A valid session time is required.");
  }
  const parts = zonedParts(date);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}T${parts.hour
    .toString()
    .padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;
}

export function getStudioDayRange(dateKey: string) {
  return {
    start: studioDateTimeLocalToIso(`${dateKey}T00:00`),
    endExclusive: studioDateTimeLocalToIso(`${addStudioDays(dateKey, 1)}T00:00`),
  };
}
