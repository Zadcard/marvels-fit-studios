// Operational settings store durations as free-text labels ("60 minutes",
// "6 hours") chosen from a fixed option list. This parses that label back
// into minutes so scheduling logic can enforce it.

const durationPattern = /^(\d+)\s*(minute|hour)s?$/i;

export function parseDurationMinutes(label: string): number | null {
  const match = durationPattern.exec(label.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return match[2].toLowerCase() === "hour" ? amount * 60 : amount;
}
