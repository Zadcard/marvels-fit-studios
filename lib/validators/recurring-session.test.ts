import { describe, expect, it } from "vitest";
import { recurringSessionTemplateSchema } from "@/lib/validators/recurring-session";

const validTemplate = {
  title: "Monday strength",
  description: "Weekly group session",
  type: "GROUP" as const,
  coachId: "coach-1",
  groupId: "group-1",
  durationMinutes: 60,
  startsOn: "2026-07-20",
  endsOn: "2026-09-20",
  slots: [
    { weekday: 0, localStartTime: "08:00" },
    { weekday: 2, localStartTime: "09:00" },
    { weekday: 4, localStartTime: "10:00" },
  ],
};

describe("recurringSessionTemplateSchema", () => {
  it("accepts a bounded weekly template with multiple slots", () => {
    expect(recurringSessionTemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  it("accepts a private template", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      type: "PRIVATE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      endsOn: "2026-07-19",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty slot list", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      slots: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 7 slots", () => {
    const slots = Array.from({ length: 8 }, (_, index) => ({
      weekday: index % 7,
      localStartTime: "08:00",
    }));
    const result = recurringSessionTemplateSchema.safeParse({ ...validTemplate, slots });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate weekday/time pairs", () => {
    const result = recurringSessionTemplateSchema.safeParse({
      ...validTemplate,
      slots: [
        { weekday: 1, localStartTime: "18:00" },
        { weekday: 1, localStartTime: "18:00" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
