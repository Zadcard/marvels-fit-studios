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
    startsAt: z.string().datetime("A valid start date and time is required."),
    endsAt: z.string().datetime("A valid end date and time is required."),
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
    action: z.enum(["CANCEL", "REASSIGN_COACH"]),
    coachId: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.action === "REASSIGN_COACH" && !value.coachId?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coachId"],
        message: "Coach is required for reassignment.",
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
