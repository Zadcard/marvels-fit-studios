import { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword?: boolean;
};

const demoUsers = {
  "admin@test.com": {
    id: "demo-admin",
    name: "System Admin",
    role: UserRole.ADMIN,
  },
  "coach@test.com": {
    id: "demo-coach",
    name: "Coach User",
    role: UserRole.COACH,
  },
  "client@test.com": {
    id: "demo-client",
    name: "Client User",
    role: UserRole.CLIENT,
  },
} as const;

export interface AuthFallbackPolicy {
  getUser(email: string, password: string): AuthenticatedUser | null;
}

export class DemoCredentialsFallbackPolicy implements AuthFallbackPolicy {
  getUser(email: string, password: string): AuthenticatedUser | null {
    const demoUser = demoUsers[email as keyof typeof demoUsers];

    if (process.env.NODE_ENV === "production") {
      return null;
    }

    if (!demoUser || password !== "password123") {
      return null;
    }

    return {
      id: demoUser.id,
      email,
      name: demoUser.name,
      role: demoUser.role,
    };
  }
}
