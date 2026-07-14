import { describe, expect, it } from "vitest";
import {
  clientCheckInInputSchema,
  programInputSchema,
  workoutPerformanceInputSchema,
} from "@/lib/validators/transformation";

describe("transformation validators", () => {
  it("requires pain details when pain is present", () => {
    const result = clientCheckInInputSchema.safeParse({
      sleepQuality: 3, energyLevel: 3, sorenessLevel: 4, stressLevel: 2,
      painPresent: true, painDetails: "", memberNote: "",
    });
    expect(result.success).toBe(false);
  });

  it("keeps program dates in order", () => {
    const result = programInputSchema.safeParse({
      clientId: "client-1", name: "Strength block", goalSummary: "",
      status: "ACTIVE", startsAt: "2026-08-01", endsAt: "2026-07-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete performance set", () => {
    const result = workoutPerformanceInputSchema.safeParse({
      clientId: "client-1",
      workoutId: "e6c6b1d4-e0da-43e4-bb36-65a02ac8cdd3",
      exerciseId: "42068f08-1be1-48c0-8bc8-da1c9307e69c",
      setNumber: 1, reps: 8, load: 40, loadUnit: "kg", rpe: 7,
      durationMinutes: 55, sessionRpe: 7, notes: "Strong set",
    });
    expect(result.success).toBe(true);
  });
});
