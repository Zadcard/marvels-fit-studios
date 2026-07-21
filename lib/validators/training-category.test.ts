import { describe, expect, it } from "vitest";

import { slugifyTrainingCategory } from "@/lib/dashboard/training-category";
import {
  deleteTrainingCategorySchema,
  saveTrainingCategorySchema,
} from "@/lib/validators/training-category";

describe("training category validation", () => {
  it("normalizes names into stable slugs", () => {
    expect(slugifyTrainingCategory("  Athlete Conditioning  ")).toBe("athlete-conditioning");
  });

  it("accepts create and edit inputs", () => {
    expect(saveTrainingCategorySchema.safeParse({ name: "Football", isActive: true }).success).toBe(true);
    expect(saveTrainingCategorySchema.safeParse({ categoryId: "a01be79d-f13a-4b1c-9d4b-89a8cbcd91aa", name: "Football", isActive: false }).success).toBe(true);
  });

  it("rejects blank names and requires explicit delete confirmation", () => {
    expect(saveTrainingCategorySchema.safeParse({ name: " ", isActive: true }).success).toBe(false);
    expect(deleteTrainingCategorySchema.safeParse({ categoryId: "a01be79d-f13a-4b1c-9d4b-89a8cbcd91aa", confirmationText: "delete" }).success).toBe(false);
  });
});
