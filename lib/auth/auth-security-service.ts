import "server-only";

import { createHmac } from "node:crypto";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AuthMethod = "client_id" | "email";

export type AuthAttemptContext = {
  keyHash: string;
  identifierHash: string;
  ipHash: string;
  method: AuthMethod;
};

export class AuthRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many sign-in attempts. Try again later.");
    this.name = "AuthRateLimitError";
  }
}

type ThrottleResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function getHashSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-auth-secret-change-me";
  }

  throw new Error("Missing AUTH_SECRET for authentication security hashing.");
}

function hashSecurityValue(value: string) {
  return createHmac("sha256", getHashSecret()).update(value).digest("hex");
}

function getRequestIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function parseThrottleResult(value: unknown): ThrottleResult {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid authentication throttle response.");
  }

  const result = value as Partial<ThrottleResult>;
  if (
    typeof result.allowed !== "boolean" ||
    typeof result.retryAfterSeconds !== "number"
  ) {
    throw new Error("Invalid authentication throttle response.");
  }

  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retryAfterSeconds,
  };
}

export class AuthSecurityService {
  createAttemptContext(
    request: Request,
    identifier: string,
    method: AuthMethod
  ): AuthAttemptContext {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const ip = getRequestIp(request);

    return {
      keyHash: hashSecurityValue(`${method}:${normalizedIdentifier}:${ip}`),
      identifierHash: hashSecurityValue(normalizedIdentifier),
      ipHash: hashSecurityValue(ip),
      method,
    };
  }

  async assertAttemptAllowed(context: AuthAttemptContext) {
    const { data, error } = await getSupabaseServerClient().rpc(
      "check_auth_throttle",
      { p_key_hash: context.keyHash }
    );

    if (error) throw error;
    const result = parseThrottleResult(data);

    if (!result.allowed) {
      throw new AuthRateLimitError(result.retryAfterSeconds);
    }
  }

  async recordAttempt(
    context: AuthAttemptContext,
    success: boolean,
    userId: string | null
  ) {
    const { error } = await getSupabaseServerClient().rpc(
      "record_auth_attempt",
      {
        p_key_hash: context.keyHash,
        p_identifier_hash: context.identifierHash,
        p_ip_hash: context.ipHash,
        p_auth_method: context.method,
        p_success: success,
        p_user_id: userId ?? undefined,
      }
    );

    if (error) throw error;
  }
}

export const authSecurityService = new AuthSecurityService();
