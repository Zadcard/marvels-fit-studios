import { describe, expect, it } from "vitest";
import { recurringSessionTemplateSchema } from "@/lib/validators/recurring-session";

const validTemplate = {
  title: "Monday strength",
  description: "Weekly group session",
  type: "GROUP" as const,
  coachId: "coach-1",
  groupId: "group-1",
  location: "Main floor",
  capacity: 12,
  weekday: 1,
  localStartTime: "18:30",
  durationMinutes: 60,
  startsOn: "2026-07-20",
  endsOn: "2026-09-20",
};

describe("recurringSessionTemplateSchema", () => {
  it("accepts a bounded weekly template", () => {
    expect(recurringSessionTemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  it("requires private sessions to have one place", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      type: "PRIVATE",
      capacity: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      endsOn: "2026-07-19",
    });
    expect(result.success).toBe(false);
  });
});
