import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { requireAuthSecret } from "@/lib/auth/auth-secret";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many requests. Try again later.");
    this.name = "RateLimitError";
  }
}

type RateLimitOptions = {
  /** Distinguishes this limiter's keys from other actions', e.g. "join-now". */
  action: string;
  /** Optional extra identity to key on besides IP, e.g. a phone number. */
  identifier?: string;
  /** Requests allowed within the window before blocking kicks in. */
  maxAttempts: number;
  /** Rolling window length, in seconds. */
  windowSeconds: number;
  /** How long a key stays blocked once it exceeds maxAttempts, in seconds. */
  blockSeconds: number;
};

function hashRateLimitValue(value: string) {
  return createHmac("sha256", requireAuthSecret()).update(value).digest("hex");
}

async function getClientIp() {
  try {
    const headerList = await headers();
    return (
      headerList.get("x-real-ip") ??
      headerList.get("cf-connecting-ip") ??
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown"
    );
  } catch {
    // No request context (e.g. unit tests calling the action directly).
    return "unknown";
  }
}

function parseRateLimitResult(value: unknown): { allowed: boolean; retryAfterSeconds: number } {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid rate limit response.");
  }
  const result = value as { allowed?: unknown; retryAfterSeconds?: unknown };
  if (typeof result.allowed !== "boolean" || typeof result.retryAfterSeconds !== "number") {
    throw new Error("Invalid rate limit response.");
  }
  return { allowed: result.allowed, retryAfterSeconds: result.retryAfterSeconds };
}

/**
 * Throws RateLimitError when the caller (keyed by action + optional
 * identifier + IP) has exceeded maxAttempts within windowSeconds. Callers
 * that don't specify `identifier` are limited purely by IP.
 */
export async function enforceRateLimit(options: RateLimitOptions) {
  const ip = await getClientIp();
  const keyHash = hashRateLimitValue(`${options.action}:${options.identifier ?? ""}:${ip}`);

  const { data, error } = await getSupabaseServerClient().rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_max_attempts: options.maxAttempts,
    p_window_seconds: options.windowSeconds,
    p_block_seconds: options.blockSeconds,
  });
  if (error) throw error;

  const result = parseRateLimitResult(data);
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterSeconds);
  }
}
