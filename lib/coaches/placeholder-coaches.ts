export const placeholderCoachNames = new Set([
  "Head Coach",
  "Unassigned Coach",
  "za",
  "za2",
  "Coach User",
]);

export function isPlaceholderCoachName(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return placeholderCoachNames.has(value.trim());
}

export function getAssignedCoachLabel(value: string | null | undefined) {
  if (!value || isPlaceholderCoachName(value)) {
    return "Unassigned";
  }

  return value;
}
