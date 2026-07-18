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

export async function withSupabaseFallback<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Dashboard reads deliberately supply a render-safe value so an empty or
    // temporarily unavailable database does not turn the whole route into a
    // runtime error. Writes do not use this helper.
    console.warn(
      "[withSupabaseFallback] database operation unavailable; rendering fallback:",
      error
    );
    return fallback;
  }
}
