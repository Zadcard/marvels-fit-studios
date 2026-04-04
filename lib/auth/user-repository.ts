import type { UserRole } from "@prisma/client";

import { getPrisma } from "@/lib/prisma";

export type PersistedAuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  password: string | null;
  role: UserRole;
};

export interface UserRepository {
  findByEmail(email: string): Promise<PersistedAuthUser | null>;
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<PersistedAuthUser | null> {
    return getPrisma().user.findUnique({ where: { email } });
  }
}
