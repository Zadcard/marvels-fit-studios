import { z } from "zod";

export const createSessionBookingSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

export const cancelSessionBookingSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

const attendanceStatuses = [
  "BOOKED",
  "ATTENDED",
  "LATE",
  "MISSED",
  "EXCUSED",
  "WAITLIST",
  "CANCELED",
  "NO_SHOW",
  "RESCHEDULED",
] as const;

export const updateSessionAttendanceSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
  status: z.enum(attendanceStatuses),
});

export const bulkUpdateSessionAttendanceSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientIds: z
    .array(z.string().trim().min(1, "Client is required."))
    .min(1, "Select at least one client."),
  status: z.enum(attendanceStatuses),
});

export type CreateSessionBookingInput = z.infer<
  typeof createSessionBookingSchema
>;
export type CancelSessionBookingInput = z.infer<
  typeof cancelSessionBookingSchema
>;
export type UpdateSessionAttendanceInput = z.infer<
  typeof updateSessionAttendanceSchema
>;
export type BulkUpdateSessionAttendanceInput = z.infer<
  typeof bulkUpdateSessionAttendanceSchema
>;
