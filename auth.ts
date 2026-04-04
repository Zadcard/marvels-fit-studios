import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";

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

function getDemoUser(email: string, password: string) {
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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user || !user.password) {
              return getDemoUser(email, password);
            }

            const passwordsMatch = await bcrypt.compare(password, user.password);

            if (passwordsMatch) {
              return user;
            }

            return getDemoUser(email, password);
          } catch (error) {
            // Allow local/demo credentials to keep the frontend auth flow usable
            // when Postgres is unavailable during development.
            const demoUser = getDemoUser(email, password);
            if (demoUser) return demoUser;

            throw error;
          }
        }

        return null;
      },
    }),
  ],
});
