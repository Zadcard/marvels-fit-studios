import { describe, expect, it } from "vitest";

import {
  decideScheduleChangeRequestSchema,
  logScheduleChangeRequestSchema,
} from "./schedule-change-request";

const base = {
  clientId: "client-1",
  reason: "Work travel",
};

describe("logScheduleChangeRequestSchema", () => {
  it("accepts a valid CANCEL_OCCURRENCE request", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "CANCEL_OCCURRENCE",
      sourceSessionId: "session-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects CANCEL_OCCURRENCE without a source session", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "CANCEL_OCCURRENCE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid MOVE_OCCURRENCE request", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "MOVE_OCCURRENCE",
      sourceSessionId: "session-1",
      targetSessionId: "session-2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects MOVE_OCCURRENCE missing a target session", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "MOVE_OCCURRENCE",
      sourceSessionId: "session-1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid RECURRING_WEEKDAYS request", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "RECURRING_WEEKDAYS",
      groupId: "group-1",
      fromWeekdays: [0],
      toWeekdays: [2],
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects RECURRING_WEEKDAYS missing weekdays or effective date", () => {
    expect(
      logScheduleChangeRequestSchema.safeParse({
        ...base,
        kind: "RECURRING_WEEKDAYS",
        groupId: "group-1",
        fromWeekdays: [0],
        toWeekdays: [],
        effectiveFrom: "2026-08-01",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid PERMANENT_GROUP_CHANGE request", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "PERMANENT_GROUP_CHANGE",
      groupId: "group-1",
      toGroupId: "group-2",
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects PERMANENT_GROUP_CHANGE missing the destination group", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "PERMANENT_GROUP_CHANGE",
      groupId: "group-1",
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects PERMANENT_GROUP_CHANGE missing the effective date", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "PERMANENT_GROUP_CHANGE",
      groupId: "group-1",
      toGroupId: "group-2",
    });
    expect(result.success).toBe(false);
  });

  it("rejects PERMANENT_GROUP_CHANGE where the destination equals the current group", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "PERMANENT_GROUP_CHANGE",
      groupId: "group-1",
      toGroupId: "group-1",
      effectiveFrom: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    const result = logScheduleChangeRequestSchema.safeParse({
      ...base,
      kind: "SOMETHING_ELSE",
      sourceSessionId: "session-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("decideScheduleChangeRequestSchema", () => {
  it("accepts a valid approval decision", () => {
    const result = decideScheduleChangeRequestSchema.safeParse({
      requestId: "550e8400-e29b-41d4-a716-446655440000",
      decision: "APPROVED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid requestId", () => {
    const result = decideScheduleChangeRequestSchema.safeParse({
      requestId: "not-a-uuid",
      decision: "APPROVED",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown decision", () => {
    const result = decideScheduleChangeRequestSchema.safeParse({
      requestId: "550e8400-e29b-41d4-a716-446655440000",
      decision: "MAYBE",
    });
    expect(result.success).toBe(false);
  });
});
