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

export class IdPasswordAuthService {
  private get prisma() {
    return getPrisma();
  }
  private passwordVerifier = new BcryptPasswordVerifier();

  async authenticate(input: LoginInput): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { clientId: input.clientId },
      select: {
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
      },
    });

    if (!user || !user.password) {
      throw new Error("Invalid client ID or password");
    }

    const isValid = await this.passwordVerifier.verify(
      input.password,
      user.password
    );

    if (!isValid) {
      throw new Error("Invalid client ID or password");
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
