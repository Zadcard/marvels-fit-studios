import { TrainingSessionType } from "@/lib/supabase/domain";
import { z } from "zod";

export const recurringSessionSlotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  localStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const recurringSessionTemplateSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    type: z.nativeEnum(TrainingSessionType),
    coachId: z.string().trim().min(1),
    groupId: z.string().trim().optional(),
    durationMinutes: z.number().int().min(15).max(480),
    startsOn: z.string().date(),
    endsOn: z.string().date().optional(),
    slots: z.array(recurringSessionSlotSchema).min(1).max(7),
  })
  .superRefine((value, context) => {
    if (value.endsOn && value.endsOn < value.startsOn) {
      context.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "End date must be on or after the start date.",
      });
    }
    const seen = new Set<string>();
    value.slots.forEach((slot, index) => {
      const key = `${slot.weekday}:${slot.localStartTime}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["slots", index],
          message: "Each day and time can only appear once in a series.",
        });
      }
      seen.add(key);
    });
  });

export const generateRecurringSessionsSchema = z.object({
  templateId: z.string().uuid(),
  throughDate: z.string().date(),
});

export const recurringSessionTemplateIdSchema = z.string().uuid();

export type RecurringSessionSlotInput = z.infer<typeof recurringSessionSlotSchema>;
export type RecurringSessionTemplateInput = z.infer<
  typeof recurringSessionTemplateSchema
>;
