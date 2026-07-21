import { z } from "zod";

export const trainingCategoryNameSchema = z
  .string()
  .trim()
  .min(2, "Category name must contain at least two characters.")
  .max(80, "Category name must be 80 characters or fewer.");

export const saveTrainingCategorySchema = z.object({
  categoryId: z.string().uuid().nullish(),
  name: trainingCategoryNameSchema,
  isActive: z.boolean(),
});

export const deleteTrainingCategorySchema = z.object({
  categoryId: z.string().uuid(),
  confirmationText: z.literal("Delete"),
});
