import bcrypt from "bcryptjs";

export interface PasswordVerifier {
  verify(plainTextPassword: string, passwordHash: string): Promise<boolean>;
}

export class BcryptPasswordVerifier implements PasswordVerifier {
  async verify(
    plainTextPassword: string,
    passwordHash: string
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, passwordHash);
  }
}
