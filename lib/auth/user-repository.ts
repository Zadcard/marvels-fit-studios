import type { UserRole } from "@prisma/client";

import { getPrisma, withPrismaFallback } from "@/lib/prisma";

export type PersistedAuthUser = {
  id: string;
  email: string | null;
  clientId: string | null;
  name: string | null;
  password: string | null;
  mustChangePassword: boolean;
  role: UserRole;
};

export interface UserRepository {
  findByEmail(email: string): Promise<PersistedAuthUser | null>;
  findByClientId(clientId: string): Promise<PersistedAuthUser | null>;
  findById(id: string): Promise<PersistedAuthUser | null>;
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<PersistedAuthUser | null> {
    return withPrismaFallback(
      () => getPrisma().user.findUnique({ where: { email } }),
      null
    );
  }

  async findByClientId(clientId: string): Promise<PersistedAuthUser | null> {
    return withPrismaFallback(
      () => getPrisma().user.findUnique({ where: { clientId } }),
      null
    );
  }

  async findById(id: string): Promise<PersistedAuthUser | null> {
    return withPrismaFallback(
      () => getPrisma().user.findUnique({ where: { id } }),
      null
    );
  }
}
