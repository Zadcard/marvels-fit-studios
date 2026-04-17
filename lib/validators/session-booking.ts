import { z } from "zod";

export const createSessionBookingSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

export const cancelSessionBookingSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

export const updateSessionAttendanceSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
  status: z.enum(["BOOKED", "ATTENDED", "MISSED", "WAITLIST"]),
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
