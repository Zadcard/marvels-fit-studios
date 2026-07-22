import { z } from "zod";

// Core studio records use text primary keys. Accept UUIDs, CUIDs, and the
// existing seeded text IDs while still rejecting blank or unbounded input.
export const databaseTextIdSchema = z
  .string()
  .trim()
  .min(1, "Record id is required.")
  .max(128, "Record id is too long.");
