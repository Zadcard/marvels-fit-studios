import { TrainingSessionType } from "@/lib/supabase/domain";
import { z } from "zod";

export const recurringSessionTemplateSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    type: z.nativeEnum(TrainingSessionType),
    coachId: z.string().trim().min(1),
    groupId: z.string().trim().optional(),
    location: z.string().trim().max(120).optional(),
    capacity: z.number().int().positive().max(100),
    weekday: z.number().int().min(0).max(6),
    localStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    durationMinutes: z.number().int().min(15).max(480),
    startsOn: z.string().date(),
    endsOn: z.string().date().optional(),
  })
  .superRefine((value, context) => {
    if (value.type === TrainingSessionType.PRIVATE && value.capacity !== 1) {
      context.addIssue({
        code: "custom",
        path: ["capacity"],
        message: "Private recurring sessions must have a capacity of 1.",
      });
    }
    if (value.endsOn && value.endsOn < value.startsOn) {
      context.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export const generateRecurringSessionsSchema = z.object({
  templateId: z.string().uuid(),
  throughDate: z.string().date(),
});

export const recurringSessionTemplateIdSchema = z.string().uuid();

export type RecurringSessionTemplateInput = z.infer<
  typeof recurringSessionTemplateSchema
>;
