import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { CredentialsAuthService } from "@/lib/auth/credentials-auth-service";
import { DemoCredentialsFallbackPolicy } from "@/lib/auth/demo-users";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";
import { PrismaUserRepository } from "@/lib/auth/user-repository";
import { getPrisma } from "@/lib/prisma";

const credentialsAuthService = new CredentialsAuthService(
  new PrismaUserRepository(),
  new BcryptPasswordVerifier(),
  new DemoCredentialsFallbackPolicy()
);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    Credentials({
      async authorize(credentials) {
        return credentialsAuthService.authorize(credentials);
      },
    }),
  ],
});
