import { TrainingSessionStatus, TrainingSessionType } from "@/lib/supabase/domain";
import { z } from "zod";

const baseSessionSchema = z
  .object({
    title: z.string().trim().min(2, "Session title is required."),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer.")
      .optional()
      .or(z.literal("")),
    type: z.nativeEnum(TrainingSessionType),
    status: z.nativeEnum(TrainingSessionStatus),
    coachId: z.string().trim().min(1, "Coach is required."),
    groupId: z.string().trim().nullable().optional(),
    location: z
      .string()
      .trim()
      .max(120, "Location must be 120 characters or fewer.")
      .optional()
      .or(z.literal("")),
    startsAt: z.string().datetime("A valid start date and time is required."),
    endsAt: z.string().datetime("A valid end date and time is required."),
    capacity: z
      .number()
      .int("Capacity must be a whole number.")
      .positive("Capacity must be greater than zero.")
      .max(100, "Capacity is too large.")
      .nullable(),
  })
  .superRefine((value, context) => {
    const startsAt = new Date(value.startsAt);
    const endsAt = new Date(value.endsAt);

    if (Number.isNaN(startsAt.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "A valid start date and time is required.",
      });
    }

    if (Number.isNaN(endsAt.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "A valid end date and time is required.",
      });
    }

    if (
      !Number.isNaN(startsAt.getTime()) &&
      !Number.isNaN(endsAt.getTime()) &&
      endsAt <= startsAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End time must be after the start time.",
      });
    }

    if (value.type === TrainingSessionType.PRIVATE && value.capacity !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capacity"],
        message: "Private sessions must have a capacity of 1.",
      });
    }
  });

export const createTrainingSessionSchema = baseSessionSchema;

export const updateTrainingSessionSchema = baseSessionSchema.extend({
  sessionId: z.string().trim().min(1, "Session id is required."),
});

export const cancelTrainingSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "Session id is required."),
});

export const deleteTrainingSessionSchema = z.object({
  sessionId: z.string().trim().min(1, "Session id is required."),
});

export const bulkUpdateTrainingSessionsSchema = z
  .object({
    sessionIds: z
      .array(z.string().trim().min(1, "Session id is required."))
      .min(1, "Select at least one session."),
    action: z.enum(["CANCEL", "REASSIGN_COACH", "UPDATE_LOCATION", "UPDATE_CAPACITY"]),
    coachId: z.string().trim().optional(),
    location: z.string().trim().optional(),
    capacity: z
      .number()
      .int("Capacity must be a whole number.")
      .positive("Capacity must be greater than zero.")
      .max(100, "Capacity is too large.")
      .nullable()
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.action === "REASSIGN_COACH" && !value.coachId?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coachId"],
        message: "Coach is required for reassignment.",
      });
    }

    if (value.action === "UPDATE_LOCATION" && !value.location?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Location is required for bulk location updates.",
      });
    }

    if (value.action === "UPDATE_CAPACITY" && value.capacity == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capacity"],
        message: "Capacity is required for bulk capacity updates.",
      });
    }
  });

export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionSchema
>;
export type UpdateTrainingSessionInput = z.infer<
  typeof updateTrainingSessionSchema
>;
export type CancelTrainingSessionInput = z.infer<
  typeof cancelTrainingSessionSchema
>;
export type DeleteTrainingSessionInput = z.infer<
  typeof deleteTrainingSessionSchema
>;
export type BulkUpdateTrainingSessionsInput = z.infer<
  typeof bulkUpdateTrainingSessionsSchema
>;
