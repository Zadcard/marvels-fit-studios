import "server-only";

import bcryptjs from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";
import type { UserRole } from "@/lib/supabase/domain";

export interface LoginInput {
  clientId: string;
  password: string;
}

export interface AuthenticatedUser {
  userId: string;
  clientId: string;
  name: string | null;
  email: string | null;
  mustChangePassword: boolean;
  role: UserRole;
}

export interface PasswordResetRequest {
  clientId: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

type AuthUserRecord = {
  id: string;
  name: string | null;
  clientId: string | null;
  email: string | null;
  password: string | null;
  mustChangePassword: boolean;
  role: UserRole;
  clientProfile: { fullName: string } | null;
};

export interface IdPasswordAuthStore {
  findByClientId(clientId: string): Promise<AuthUserRecord | null>;
  findByPhones(phones: string[]): Promise<AuthUserRecord | null>;
  findResetToken(token: string, now: Date): Promise<{ id: string } | null>;
  findPassword(userId: string): Promise<{ password: string | null } | null>;
  findIdByClientId(clientId: string): Promise<{ id: string } | null>;
  updateUser(userId: string, data: {
    lastLoginAt?: Date;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    password?: string;
    mustChangePassword?: boolean;
  }): Promise<void>;
}

const supabaseAuthStore: IdPasswordAuthStore = {
  async findByClientId(clientId) {
    const { data, error } = await getSupabaseServerClient()
      .from("User")
      .select("id,name,clientId,email,password,mustChangePassword,role,clientProfile:Client(fullName)")
      .eq("clientId", clientId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, clientProfile: data.clientProfile[0] ?? null };
  },
  async findByPhones(phones) {
    const { data, error } = await getSupabaseServerClient()
      .from("Client")
      .select("user:User(id,name,clientId,email,password,mustChangePassword,role),fullName")
      .in("phone", phones)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? { ...data.user, clientProfile: { fullName: data.fullName } } : null;
  },
  async findResetToken(token, now) {
    const { data, error } = await getSupabaseServerClient()
      .from("User").select("id").eq("passwordResetToken", token)
      .gt("passwordResetExpires", now.toISOString()).maybeSingle();
    if (error) throw error;
    return data;
  },
  async findPassword(userId) {
    const { data, error } = await getSupabaseServerClient()
      .from("User").select("password").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async findIdByClientId(clientId) {
    const { data, error } = await getSupabaseServerClient()
      .from("User").select("id").eq("clientId", clientId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async updateUser(userId, data) {
    const update = {
      ...data,
      lastLoginAt: data.lastLoginAt?.toISOString(),
      passwordResetExpires:
        data.passwordResetExpires instanceof Date
          ? data.passwordResetExpires.toISOString()
          : data.passwordResetExpires,
    };
    const { error } = await getSupabaseServerClient()
      .from("User").update(update).eq("id", userId);
    if (error) throw error;
  },
};

function getPhoneCandidates(identifier: string) {
  const trimmed = identifier.trim();
  const digits = trimmed.replace(/\D/g, "");
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }

  if (digits) {
    candidates.add(digits);

    if (digits.startsWith("00")) {
      candidates.add(`+${digits.slice(2)}`);
    }

    if (digits.startsWith("20")) {
      candidates.add(`+${digits}`);
    }

    if (digits.startsWith("0")) {
      candidates.add(`+20${digits.slice(1)}`);
    }
  }

  return [...candidates];
}

export class IdPasswordAuthService {
  constructor(private readonly store: IdPasswordAuthStore = supabaseAuthStore) {}
  private passwordVerifier = new BcryptPasswordVerifier();

  private async findUserByLoginIdentifier(identifier: string) {
    const clientId = identifier.trim();

    const userByClientId = await this.store.findByClientId(clientId);

    if (userByClientId) {
      return userByClientId;
    }

    const phoneCandidates = getPhoneCandidates(identifier);

    if (phoneCandidates.length === 0) {
      return null;
    }

    return this.store.findByPhones(phoneCandidates);
  }

  async authenticate(input: LoginInput): Promise<AuthenticatedUser> {
    const user = await this.findUserByLoginIdentifier(input.clientId);

    if (!user || !user.password) {
      throw new Error("Invalid client ID, phone, or password");
    }

    const isValid = await this.passwordVerifier.verify(
      input.password,
      user.password
    );

    if (!isValid) {
      throw new Error("Invalid client ID, phone, or password");
    }

    await this.store.updateUser(user.id, { lastLoginAt: new Date() });

    return {
      userId: user.id,
      clientId: user.clientId!,
      name: user.clientProfile?.fullName ?? user.name,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
      role: user.role,
    };
  }

  async requestPasswordReset(clientId: string): Promise<void> {
    const user = await this.store.findIdByClientId(clientId);

    if (!user) {
      return;
    }

    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.store.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.store.findResetToken(token, new Date());

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await this.store.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.store.findPassword(userId);

    if (!user || !user.password) {
      throw new Error("User not found");
    }

    const isValid = await this.passwordVerifier.verify(
      currentPassword,
      user.password
    );

    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await this.store.updateUser(userId, {
        password: hashedPassword,
        mustChangePassword: false,
    });
  }

  private generateResetToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

export const idPasswordAuthService = new IdPasswordAuthService();
