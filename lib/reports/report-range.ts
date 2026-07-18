const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value: string | undefined): value is string {
  if (!value || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function zonedMidnightToUtc(value: string, timezone: string) {
  const estimate = new Date(`${value}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(estimate);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? 0);
  const representedAsUtc = Date.UTC(
    part("year"), part("month") - 1, part("day"),
    part("hour"), part("minute"), part("second"),
  );
  return new Date(estimate.getTime() - (representedAsUtc - estimate.getTime()));
}

export function resolveReportRange(
  input: { from?: string; to?: string },
  timezone: string,
  now = new Date(),
) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const defaultFrom = addDays(today, -29);
  let from = isDateOnly(input.from) ? input.from : defaultFrom;
  let to = isDateOnly(input.to) ? input.to : today;
  const fromTime = new Date(`${from}T00:00:00Z`).getTime();
  const toTime = new Date(`${to}T00:00:00Z`).getTime();
  const durationDays = Math.round((toTime - fromTime) / 86_400_000) + 1;
  if (durationDays < 1 || durationDays > 366) {
    from = defaultFrom;
    to = today;
  }
  return {
    from,
    to,
    timezone,
    startIso: zonedMidnightToUtc(from, timezone).toISOString(),
    endExclusiveIso: zonedMidnightToUtc(addDays(to, 1), timezone).toISOString(),
  };
}

export function datesInRange(from: string, to: string) {
  const dates: string[] = [];
  for (let value = from; value <= to; value = addDays(value, 1)) dates.push(value);
  return dates;
}
