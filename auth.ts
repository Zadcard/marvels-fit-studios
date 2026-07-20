import NextAuth, { CredentialsSignin } from "next-auth";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
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

class RateLimitedCredentialsSignin extends CredentialsSignin {
  code = "rate_limited";
}

class AuthServiceUnavailableSignin extends CredentialsSignin {
  code = "service_unavailable";
}

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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = ((credentials?.email as string) || "")
          .trim()
          .toLowerCase();
        const password = (credentials?.password as string) || "";

        if (!email || !password) {
          return null;
        }

        const attemptContext = authSecurityService.createAttemptContext(
          request,
          email,
          "email"
        );

        try {
          await authSecurityService.assertAttemptAllowed(attemptContext);

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
        } catch (error) {
          if (error instanceof AuthRateLimitError) {
            throw new RateLimitedCredentialsSignin();
          }

          console.error("[auth] sign-in failed because of a system error:", error);
          throw new AuthServiceUnavailableSignin();
        }
      },
    }),
  ],
});
