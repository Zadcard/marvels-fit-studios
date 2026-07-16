import { describe, expect, it } from "vitest";

import {
  findCoachConflicts,
  rangesOverlap,
} from "@/lib/services/schedule-conflicts";

const existing = [
  {
    id: "a",
    title: "Morning group",
    startsAt: "2026-07-16T08:00:00.000Z",
    endsAt: "2026-07-16T09:00:00.000Z",
  },
  {
    id: "b",
    title: "Evening private",
    startsAt: "2026-07-16T18:00:00.000Z",
    endsAt: "2026-07-16T19:00:00.000Z",
  },
];

describe("rangesOverlap", () => {
  it("detects overlap and treats touching edges as non-overlapping", () => {
    expect(rangesOverlap(0, 10, 5, 15)).toBe(true);
    expect(rangesOverlap(0, 10, 10, 20)).toBe(false);
    expect(rangesOverlap(0, 10, 20, 30)).toBe(false);
  });
});

describe("findCoachConflicts", () => {
  it("flags a session that overlaps an existing one", () => {
    const conflicts = findCoachConflicts(
      { startsAt: "2026-07-16T08:30:00.000Z", endsAt: "2026-07-16T09:30:00.000Z" },
      existing,
    );
    expect(conflicts.map((session) => session.id)).toEqual(["a"]);
  });

  it("allows a back-to-back session that only touches an edge", () => {
    const conflicts = findCoachConflicts(
      { startsAt: "2026-07-16T09:00:00.000Z", endsAt: "2026-07-16T10:00:00.000Z" },
      existing,
    );
    expect(conflicts).toEqual([]);
  });

  it("ignores the session being edited", () => {
    const conflicts = findCoachConflicts(
      { startsAt: "2026-07-16T08:00:00.000Z", endsAt: "2026-07-16T09:00:00.000Z" },
      existing,
      "a",
    );
    expect(conflicts).toEqual([]);
  });

  it("returns nothing for a free slot", () => {
    const conflicts = findCoachConflicts(
      { startsAt: "2026-07-16T12:00:00.000Z", endsAt: "2026-07-16T13:00:00.000Z" },
      existing,
    );
    expect(conflicts).toEqual([]);
  });
});
