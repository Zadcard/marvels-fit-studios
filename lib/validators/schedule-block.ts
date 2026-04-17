import {
  ScheduleBlockStatus,
  ScheduleRecurrenceType,
  TrainingSessionType,
} from "@prisma/client";
import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Time must use HH:MM format.");

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.");

const baseScheduleBlockSchema = z
  .object({
    title: z.string().trim().min(2, "Block title is required."),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer.")
      .optional()
      .or(z.literal("")),
    sessionType: z.nativeEnum(TrainingSessionType),
    status: z.nativeEnum(ScheduleBlockStatus),
    recurrenceType: z.nativeEnum(ScheduleRecurrenceType),
    recurrenceDays: z
      .array(z.string().trim().min(1))
      .min(1, "Select at least one recurrence day."),
    startsOn: dateSchema,
    endsOn: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    timezone: z.string().trim().min(1, "Timezone is required."),
    coachId: z.string().trim().min(1, "Coach is required."),
    groupId: z.string().trim().optional().or(z.literal("")),
    clientIds: z.array(z.string().trim().min(1)).default([]),
    location: z
      .string()
      .trim()
      .max(120, "Location must be 120 characters or fewer.")
      .optional()
      .or(z.literal("")),
    capacity: z
      .number()
      .int("Capacity must be a whole number.")
      .positive("Capacity must be greater than zero.")
      .max(100, "Capacity is too large.")
      .nullable(),
  })
  .superRefine((value, context) => {
    const startsOn = new Date(`${value.startsOn}T00:00:00`);
    const endsOn = new Date(`${value.endsOn}T00:00:00`);

    if (Number.isNaN(startsOn.getTime()) || Number.isNaN(endsOn.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsOn"],
        message: "Start and end dates must be valid.",
      });
    }

    if (
      !Number.isNaN(startsOn.getTime()) &&
      !Number.isNaN(endsOn.getTime()) &&
      endsOn < startsOn
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsOn"],
        message: "End date must be on or after the start date.",
      });
    }

    if (value.startTime >= value.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }

    if (value.sessionType === TrainingSessionType.PRIVATE && value.capacity !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["capacity"],
        message: "Private blocks must have a capacity of 1.",
      });
    }

    if (
      value.sessionType === TrainingSessionType.PRIVATE &&
      value.clientIds.length > 1
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clientIds"],
        message: "Private blocks can only keep one client in the roster.",
      });
    }
  });

export const createScheduleBlockSchema = baseScheduleBlockSchema;

export const updateScheduleBlockSchema = baseScheduleBlockSchema.extend({
  blockId: z.string().trim().min(1, "Block id is required."),
  scope: z.enum(["THIS_AND_FUTURE", "ENTIRE_SERIES"]),
});

export const scheduleBlockRosterMutationSchema = z.object({
  blockId: z.string().trim().min(1, "Block id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

export const reassignScheduleBlockCoachSchema = z.object({
  blockId: z.string().trim().min(1, "Block id is required."),
  coachId: z.string().trim().min(1, "Coach is required."),
});

export const scheduleBlockLifecycleSchema = z.object({
  blockId: z.string().trim().min(1, "Block id is required."),
  nextStatus: z.nativeEnum(ScheduleBlockStatus),
});

export const duplicateScheduleBlockSchema = z.object({
  blockId: z.string().trim().min(1, "Block id is required."),
  startsOn: dateSchema,
  endsOn: dateSchema,
});

export type CreateScheduleBlockInput = z.infer<typeof createScheduleBlockSchema>;
export type UpdateScheduleBlockInput = z.infer<typeof updateScheduleBlockSchema>;
export type ScheduleBlockRosterMutationInput = z.infer<
  typeof scheduleBlockRosterMutationSchema
>;
export type ReassignScheduleBlockCoachInput = z.infer<
  typeof reassignScheduleBlockCoachSchema
>;
export type ScheduleBlockLifecycleInput = z.infer<
  typeof scheduleBlockLifecycleSchema
>;
export type DuplicateScheduleBlockInput = z.infer<
  typeof duplicateScheduleBlockSchema
>;
