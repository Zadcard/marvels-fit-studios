import "server-only";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordResetTarget = {
  profileId: string;
  profileType: "client" | "coach";
};

export type IssuedPasswordReset = {
  expiresAt: string;
  path: string;
};

export interface PasswordResetStore {
  resolveTargetUserId(target: PasswordResetTarget): Promise<string | null>;
  issueGrant(input: {
    createdById: string;
    expiresAt: Date;
    tokenHash: string;
    userId: string;
  }): Promise<void>;
  hasActiveGrant(tokenHash: string, now: Date): Promise<boolean>;
  consumeGrant(tokenHash: string, passwordHash: string): Promise<boolean>;
}

const supabasePasswordResetStore: PasswordResetStore = {
  async resolveTargetUserId(target) {
    const supabase = getSupabaseServerClient();
    const result =
      target.profileType === "client"
        ? await supabase
            .from("Client")
            .select("userId")
            .eq("id", target.profileId)
            .maybeSingle()
        : await supabase
            .from("Coach")
            .select("userId")
            .eq("id", target.profileId)
            .maybeSingle();

    if (result.error) throw result.error;
    return result.data?.userId ?? null;
  },

  async issueGrant(input) {
    const { error } = await getSupabaseServerClient().rpc(
      "issue_password_reset_grant",
      {
        p_created_by_id: input.createdById,
        p_expires_at: input.expiresAt.toISOString(),
        p_token_hash: input.tokenHash,
        p_user_id: input.userId,
      },
    );
    if (error) throw error;
  },

  async hasActiveGrant(tokenHash, now) {
    const { data, error } = await getSupabaseServerClient()
      .from("PasswordResetGrant")
      .select("id")
      .eq("tokenHash", tokenHash)
      .is("usedAt", null)
      .is("revokedAt", null)
      .gt("expiresAt", now.toISOString())
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },

  async consumeGrant(tokenHash, passwordHash) {
    const { data, error } = await getSupabaseServerClient().rpc(
      "consume_password_reset_grant",
      {
        p_password_hash: passwordHash,
        p_token_hash: tokenHash,
      },
    );
    if (error) throw error;
    return data;
  },
};

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class PasswordResetService {
  constructor(
    private readonly store: PasswordResetStore = supabasePasswordResetStore,
  ) {}

  async issue(
    target: PasswordResetTarget,
    createdById: string,
  ): Promise<IssuedPasswordReset> {
    const userId = await this.store.resolveTargetUserId(target);

    if (!userId) {
      throw new Error("Account not found.");
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.store.issueGrant({
      createdById,
      expiresAt,
      tokenHash,
      userId,
    });

    return {
      expiresAt: expiresAt.toISOString(),
      path: `/reset-password?token=${encodeURIComponent(token)}`,
    };
  }

  async consume(token: string, newPassword: string) {
    const normalizedToken = token.trim();

    if (!/^[A-Za-z0-9_-]{43}$/.test(normalizedToken)) {
      return false;
    }

    const tokenHash = hashResetToken(normalizedToken);
    const isActive = await this.store.hasActiveGrant(tokenHash, new Date());

    if (!isActive) {
      return false;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.store.consumeGrant(tokenHash, passwordHash);
  }
}

export const passwordResetService = new PasswordResetService();
