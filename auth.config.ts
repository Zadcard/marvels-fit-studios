import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@/lib/supabase/domain";
import { resolveAuthSecret } from "@/lib/auth/auth-secret";

export default {
  session: { strategy: "jwt" },
  secret: resolveAuthSecret(),
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          role?: UserRole;
          mustChangePassword?: boolean;
        };
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = authUser.role;
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

      if (session.user) {
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
