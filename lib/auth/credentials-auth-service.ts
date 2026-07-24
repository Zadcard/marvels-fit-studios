import { UserRole } from "@/lib/supabase/domain";

import { parseCredentials } from "@/lib/auth/credentials";
import type { PasswordVerifier } from "@/lib/auth/password-verifier";
import type {
  PersistedAuthUser,
  UserRepository,
} from "@/lib/auth/user-repository";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword?: boolean;
};

function toAuthenticatedUser(user: PersistedAuthUser): AuthenticatedUser | null {
  if (!user.email) {
    return null;
  }

  // Clients are managed by staff and do not log into the application directly
  if (user.role === UserRole.CLIENT) {
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
    private readonly passwordVerifier: PasswordVerifier
  ) {}

  async authorize(credentials: unknown): Promise<AuthenticatedUser | null> {
    const parsedCredentials = parseCredentials(credentials);

    if (!parsedCredentials) {
      return null;
    }

    const { email, password } = parsedCredentials;
    const user = await this.userRepository.findByEmail(email);

    if (!user?.password) {
      return null;
    }

    // Explicitly reject interactive client login attempts
    if (user.role === UserRole.CLIENT) {
      return null;
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
