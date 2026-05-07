import "server-only";

import bcryptjs from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";
import type { UserRole } from "@prisma/client";

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

const authUserSelect = {
  id: true,
  name: true,
  clientId: true,
  email: true,
  password: true,
  mustChangePassword: true,
  role: true,
  clientProfile: {
    select: {
      fullName: true,
    },
  },
} as const;

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
  private get prisma() {
    return getPrisma();
  }
  private passwordVerifier = new BcryptPasswordVerifier();

  private async findUserByLoginIdentifier(identifier: string) {
    const clientId = identifier.trim();

    const userByClientId = await this.prisma.user.findUnique({
      where: { clientId },
      select: authUserSelect,
    });

    if (userByClientId) {
      return userByClientId;
    }

    const phoneCandidates = getPhoneCandidates(identifier);

    if (phoneCandidates.length === 0) {
      return null;
    }

    const clientByPhone = await this.prisma.client.findFirst({
      where: {
        phone: {
          in: phoneCandidates,
        },
      },
      select: {
        user: {
          select: authUserSelect,
        },
      },
    });

    return clientByPhone?.user ?? null;
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
    const user = await this.prisma.user.findUnique({
      where: { clientId },
      select: { id: true },
    });

    if (!user) {
      return;
    }

    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

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

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });
  }

  private generateResetToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

export const idPasswordAuthService = new IdPasswordAuthService();
