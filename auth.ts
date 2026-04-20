import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { idPasswordAuthService } from "@/lib/auth/id-password-auth-service";
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
      credentials: {
        clientId: { label: "Client ID", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const clientId = (credentials?.clientId as string) || "";
        const email = (credentials?.email as string) || "";
        const password = (credentials?.password as string) || "";

        if (!password) {
          return null;
        }

        try {
          if (clientId) {
            const authResult = await idPasswordAuthService.authenticate({
              clientId: clientId.trim(),
              password,
            });

            return {
              id: authResult.userId,
              name: authResult.name,
              email: authResult.email,
              clientId: authResult.clientId,
              mustChangePassword: authResult.mustChangePassword,
              role: authResult.role,
            };
          } else if (email) {
            return credentialsAuthService.authorize({
              email,
              password,
            });
          }

          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
});
