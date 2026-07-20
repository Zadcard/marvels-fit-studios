import { UserRole } from "@/lib/supabase/domain";
import { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: UserRole;
  mustChangePassword?: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    mustChangePassword?: boolean;
    name?: string | null;
    email?: string | null;
  }
}
