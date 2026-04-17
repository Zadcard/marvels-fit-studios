import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (isProduction ? undefined : "dev-only-auth-secret-change-me");

export default {
  session: { strategy: "jwt" },
  secret: authSecret,
  trustHost: process.env.NODE_ENV !== "production",
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          role?: UserRole;
          clientId?: string;
        };
        token.sub = user.id;
        token.role = authUser.role;
        if (authUser.clientId) {
          token.clientId = authUser.clientId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (session.user && token.role) {
        session.user.role = token.role as UserRole;
      }

      if (session.user && token.clientId) {
        session.user.clientId = token.clientId as string;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
