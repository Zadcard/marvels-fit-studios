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

function formatErrorForLog(error: unknown): Record<string, unknown> | string {
  if (!error) return "Unknown error (null/undefined)";
  if (error instanceof Error) {
    const errObj = error as unknown as Record<string, unknown>;
    return {
      name: error.name,
      message: error.message || String(error),
      code: errObj.code,
      details: errObj.details,
      hint: errObj.hint,
      stack: error.stack,
      cause: error.cause ? formatErrorForLog(error.cause) : undefined,
    };
  }
  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    const rawMessage = errObj.message ?? errObj.msg ?? errObj.details ?? errObj.hint;
    const message = rawMessage ? String(rawMessage) : JSON.stringify(error);
    return {
      message: message === "{}" ? Object.prototype.toString.call(error) : message,
      code: errObj.code,
      details: errObj.details,
      hint: errObj.hint,
      ...errObj,
    };
  }
  return String(error);
}


export async function withSupabaseFallback<T>(
  operation: () => Promise<T>,
  _legacyFallback: T,
): Promise<T> {
  void _legacyFallback;
  try {
    return await operation();
  } catch (error) {
    console.error(
      "[withSupabaseFallback] database operation unavailable:",
      formatErrorForLog(error),
    );
    throw new OperationalDataUnavailableError({ cause: error });
  }
}

