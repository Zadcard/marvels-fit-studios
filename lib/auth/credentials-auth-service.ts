import type { UserRole } from "@/lib/supabase/domain";

import { parseCredentials } from "@/lib/auth/credentials";
import type {
  AuthenticatedUser,
  AuthFallbackPolicy,
} from "@/lib/auth/demo-users";
import type { PasswordVerifier } from "@/lib/auth/password-verifier";
import type {
  PersistedAuthUser,
  UserRepository,
} from "@/lib/auth/user-repository";

function toAuthenticatedUser(user: PersistedAuthUser): AuthenticatedUser | null {
  if (!user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "Portal user",
    role: user.role as UserRole,
    mustChangePassword: user.mustChangePassword,
  };
}

export class CredentialsAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly fallbackPolicy: AuthFallbackPolicy
  ) {}

  async authorize(credentials: unknown): Promise<AuthenticatedUser | null> {
    const parsedCredentials = parseCredentials(credentials);

    if (!parsedCredentials) {
      return null;
    }

    const { email, password } = parsedCredentials;
    const fallbackUser = () => this.fallbackPolicy.getUser(email, password);

    let user;
    try {
      user = await this.userRepository.findByEmail(email);
    } catch {
      return fallbackUser();
    }

    if (!user?.password) {
      return fallbackUser();
    }

    const passwordsMatch = await this.passwordVerifier.verify(
      password,
      user.password
    );

    if (passwordsMatch) {
      return toAuthenticatedUser(user);
    }

    return null;
  }
}
