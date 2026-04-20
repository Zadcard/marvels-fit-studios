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
          mustChangePassword?: boolean;
        };
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = authUser.role;
        if (authUser.clientId) {
          token.clientId = authUser.clientId;
        }
        token.mustChangePassword = authUser.mustChangePassword ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (session.user && token.name) {
        session.user.name = token.name;
      }

      if (session.user && token.email) {
        session.user.email = token.email;
      }

      if (session.user && token.role) {
        session.user.role = token.role as UserRole;
      }

      if (session.user && token.clientId) {
        session.user.clientId = token.clientId as string;
      }

      if (session.user) {
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
