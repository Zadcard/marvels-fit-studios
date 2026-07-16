// Coach scheduling conflicts. Per Marvel's operating model the open studio can
// host more than one activity at once, so a room clash is only a warning — but a
// coach being in two sessions at the same time is a real conflict and must be
// blocked. These pure helpers are unit-tested and used by the session service.

export type ConflictSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

/** Half-open overlap: [aStart, aEnd) intersects [bStart, bEnd). Millisecond inputs. */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Returns the coach's existing sessions that overlap the proposed time window.
 * `ignoreSessionId` skips the session being edited so it never conflicts with
 * itself. Invalid/unparseable dates are treated as non-overlapping.
 */
export function findCoachConflicts(
  proposed: { startsAt: string; endsAt: string },
  existing: ConflictSession[],
  ignoreSessionId?: string,
): ConflictSession[] {
  const proposedStart = Date.parse(proposed.startsAt);
  const proposedEnd = Date.parse(proposed.endsAt);

  if (Number.isNaN(proposedStart) || Number.isNaN(proposedEnd)) {
    return [];
  }

  return existing.filter((session) => {
    if (session.id === ignoreSessionId) {
      return false;
    }
    const start = Date.parse(session.startsAt);
    const end = Date.parse(session.endsAt);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return false;
    }
    return rangesOverlap(proposedStart, proposedEnd, start, end);
  });
}
