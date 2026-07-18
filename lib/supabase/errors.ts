import type { PostgrestError } from "@supabase/supabase-js";

export class DatabaseOperationError extends Error {
  readonly code: string | undefined;

  constructor(operation: string, error: Pick<PostgrestError, "code">) {
    super(`Database operation failed: ${operation}`);
    this.name = "DatabaseOperationError";
    this.code = error.code;
  }
}

export class OperationalDataUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      "Live studio data is temporarily unavailable. No empty totals are being shown. Retry before making operational decisions.",
      options,
    );
    this.name = "OperationalDataUnavailableError";
  }
}

export function throwIfSupabaseError(
  operation: string,
  error: PostgrestError | null,
) {
  if (error) {
    throw new DatabaseOperationError(operation, error);
  }
}

export async function withSupabaseFallback<T>(
  operation: () => Promise<T>,
  _legacyFallback: T,
): Promise<T> {
  void _legacyFallback;
  try {
    return await operation();
  } catch (error) {
    // Keep the cause in server logs, but never turn an outage into believable
    // empty business data. Dashboard error boundaries render the safe message.
    console.error("[withSupabaseFallback] database operation unavailable:", error);
    throw new OperationalDataUnavailableError({ cause: error });
  }
}
