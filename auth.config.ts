import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";

export default {
  session: { strategy: "jwt" },
  trustHost: process.env.NODE_ENV !== "production",
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & { role?: UserRole };
        token.sub = user.id;
        token.role = authUser.role;
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

      return session;
    },
  },
} satisfies NextAuthConfig;
