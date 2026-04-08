import { z } from "zod";

export const createSessionBookingSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

export const cancelSessionBookingSchema = z.object({
  trainingSessionId: z.string().trim().min(1, "Session id is required."),
  clientId: z.string().trim().min(1, "Client is required."),
});

export type CreateSessionBookingInput = z.infer<
  typeof createSessionBookingSchema
>;
export type CancelSessionBookingInput = z.infer<
  typeof cancelSessionBookingSchema
>;
