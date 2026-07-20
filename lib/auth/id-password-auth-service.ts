import "server-only";

import bcryptjs from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface AccountPasswordStore {
  findPassword(userId: string): Promise<{ password: string | null } | null>;
  updateUser(userId: string, data: {
    lastLoginAt?: Date;
    password?: string;
    mustChangePassword?: boolean;
  }): Promise<void>;
}

const supabaseAuthStore: AccountPasswordStore = {
  async findPassword(userId) {
    const { data, error } = await getSupabaseServerClient()
      .from("User").select("password").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async updateUser(userId, data) {
    const update = {
      ...data,
      lastLoginAt: data.lastLoginAt?.toISOString(),
    };
    const { error } = await getSupabaseServerClient()
      .from("User").update(update).eq("id", userId);
    if (error) throw error;
  },
};

export class IdPasswordAuthService {
  constructor(private readonly store: AccountPasswordStore = supabaseAuthStore) {}
  private passwordVerifier = new BcryptPasswordVerifier();

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
}

export const idPasswordAuthService = new IdPasswordAuthService();
