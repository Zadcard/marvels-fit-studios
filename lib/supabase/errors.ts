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
  _fallback: T
): Promise<T> {
  void _fallback;

  try {
    return await operation();
  } catch (error) {
    // Keep the legacy helper signature while repositories migrate to an
    // explicit result type. Rendering an empty studio during an outage is
    // unsafe, so log the failure and let the nearest route error boundary
    // present an unavailable state.
    console.error("[withSupabaseFallback] database operation failed:", error);
    throw error;
  }
}
