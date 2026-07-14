import NextAuth from "next-auth";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import {
  idPasswordAuthService,
  InvalidCredentialsError,
} from "@/lib/auth/id-password-auth-service";
import {
  authSecurityService,
  AuthRateLimitError,
} from "@/lib/auth/auth-security-service";
import { CredentialsAuthService } from "@/lib/auth/credentials-auth-service";
import { BcryptPasswordVerifier } from "@/lib/auth/password-verifier";
import { SupabaseUserRepository } from "@/lib/auth/user-repository";

const credentialsAuthService = new CredentialsAuthService(
  new SupabaseUserRepository(),
  new BcryptPasswordVerifier()
);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        clientId: { label: "Client ID", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const clientId = (credentials?.clientId as string) || "";
        const email = ((credentials?.email as string) || "")
          .trim()
          .toLowerCase();
        const password = (credentials?.password as string) || "";

        if (!password) {
          return null;
        }

        const method = clientId ? "client_id" : "email";
        const identifier = clientId ? clientId.trim() : email;

        if (!identifier) {
          return null;
        }

        const attemptContext = authSecurityService.createAttemptContext(
          request,
          identifier,
          method
        );

        try {
          await authSecurityService.assertAttemptAllowed(attemptContext);

          if (clientId) {
            const authResult = await idPasswordAuthService.authenticate({
              clientId: clientId.trim(),
              password,
            });

            await authSecurityService.recordAttempt(
              attemptContext,
              true,
              authResult.userId
            );

            return {
              id: authResult.userId,
              name: authResult.name,
              email: authResult.email,
              clientId: authResult.clientId,
              mustChangePassword: authResult.mustChangePassword,
              role: authResult.role,
            };
          } else if (email) {
            const user = await credentialsAuthService.authorize({
              email,
              password,
            });

            await authSecurityService.recordAttempt(
              attemptContext,
              Boolean(user),
              user?.id ?? null
            );

            return user;
          }

          return null;
        } catch (error) {
          if (error instanceof InvalidCredentialsError) {
            await authSecurityService.recordAttempt(attemptContext, false, null);
            return null;
          }

          if (error instanceof AuthRateLimitError) {
            return null;
          }

          console.error("[auth] sign-in failed because of a system error:", error);
          return null;
        }
      },
    }),
  ],
});
