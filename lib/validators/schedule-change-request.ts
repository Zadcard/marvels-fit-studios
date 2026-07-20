import { z } from "zod";

export const scheduleChangeRequestKinds = [
  "CANCEL_OCCURRENCE",
  "MOVE_OCCURRENCE",
  "RECURRING_WEEKDAYS",
  "PERMANENT_GROUP_CHANGE",
] as const;

export const logScheduleChangeRequestSchema = z
  .object({
    clientId: z.string().trim().min(1, "Client is required."),
    kind: z.enum(scheduleChangeRequestKinds),
    reason: z.string().trim().min(2, "A reason is required.").max(300),
    sourceSessionId: z.string().trim().min(1).optional(),
    targetSessionId: z.string().trim().min(1).optional(),
    groupId: z.string().trim().min(1).optional(),
    toGroupId: z.string().trim().min(1).optional(),
    fromWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
    toWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
    effectiveFrom: z.string().date().optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === "CANCEL_OCCURRENCE" && !value.sourceSessionId) {
      context.addIssue({
        code: "custom",
        path: ["sourceSessionId"],
        message: "A session is required to cancel a booking.",
      });
    }
    if (value.kind === "MOVE_OCCURRENCE" && (!value.sourceSessionId || !value.targetSessionId)) {
      context.addIssue({
        code: "custom",
        path: ["targetSessionId"],
        message: "A source and target session are required to move a booking.",
      });
    }
    if (
      value.kind === "RECURRING_WEEKDAYS" &&
      (!value.groupId || !value.fromWeekdays?.length || !value.toWeekdays?.length || !value.effectiveFrom)
    ) {
      context.addIssue({
        code: "custom",
        path: ["groupId"],
        message: "A group, from/to weekdays, and an effective date are required.",
      });
    }
    if (value.kind === "PERMANENT_GROUP_CHANGE") {
      if (!value.groupId || !value.toGroupId || !value.effectiveFrom) {
        context.addIssue({
          code: "custom",
          path: ["toGroupId"],
          message: "A current group, a new group, and an effective date are required.",
        });
      } else if (value.groupId === value.toGroupId) {
        context.addIssue({
          code: "custom",
          path: ["toGroupId"],
          message: "The new group must be different from the current group.",
        });
      }
    }
  });

export type LogScheduleChangeRequestInput = z.infer<typeof logScheduleChangeRequestSchema>;

export const decideScheduleChangeRequestSchema = z.object({
  requestId: z.uuid(),
  decision: z.enum(["APPROVED", "DECLINED"]),
});
