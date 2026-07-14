import type { PostgrestError } from "@supabase/supabase-js";

export class DatabaseOperationError extends Error {
  readonly code: string | undefined;

  constructor(operation: string, error: Pick<PostgrestError, "code">) {
    super(`Database operation failed: ${operation}`);
    this.name = "DatabaseOperationError";
    this.code = error.code;
  }
}

export function throwIfSupabaseError(
  operation: string,
  error: PostgrestError | null
) {
  if (error) {
    throw new DatabaseOperationError(operation, error);
  }
}

