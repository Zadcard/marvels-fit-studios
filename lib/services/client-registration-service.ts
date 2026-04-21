import bcryptjs from "bcryptjs";

import { clientIdGenerator } from "@/lib/services/client-id-generator";
import { passwordGenerator } from "@/lib/services/password-generator";
import { getPrisma } from "@/lib/prisma";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";

export interface RegisterClientInput {
  fullName: string;
  phone: string;
  email?: string;
  groupId?: string;
}

export interface RegisterClientResult {
  userId: string;
  clientId: string;
  temporaryPassword: string;
}

export interface ResolvedClientGroup {
  id: string;
  name: string;
}

export class ClientRegistrationService {
  private prisma = getPrisma();
  private passwordVerifier = new BcryptPasswordVerifier();

  async registerClient(
    input: RegisterClientInput
  ): Promise<RegisterClientResult> {
    const nextNumber = await clientIdGenerator.getNextClientNumber();
    const clientId = clientIdGenerator.generateId({ clientNumber: nextNumber });
    const temporaryPassword = passwordGenerator.generatePassword(clientId);

    const hashedPassword = await bcryptjs.hash(temporaryPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.fullName,
          clientId,
          email: input.email || null,
          password: hashedPassword,
          mustChangePassword: true,
          role: "CLIENT",
        },
        select: { id: true },
      });

      await tx.client.create({
        data: {
          userId: user.id,
          fullName: input.fullName,
          phone: input.phone,
          groupId: input.groupId ?? null,
          status: "ACTIVE",
        },
      });

      return { userId: user.id, clientId };
    });

    return {
      userId: result.userId,
      clientId: result.clientId,
      temporaryPassword,
    };
  }

  async isPhoneAvailable(phone: string): Promise<boolean> {
    const existing = await this.prisma.client.findUnique({
      where: { phone },
    });
    return !existing;
  }

  async findGroupByName(groupName: string): Promise<ResolvedClientGroup | null> {
    return this.prisma.group.findFirst({
      where: {
        name: {
          equals: groupName.trim(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}

export const clientRegistrationService = new ClientRegistrationService();
