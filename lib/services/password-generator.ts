export class PasswordGenerator {
  generatePassword(clientId: string): string {
    if (!/^\d{7}$/.test(clientId)) {
      throw new Error("Invalid client ID format");
    }
    return `MFS_${clientId}`;
  }

  isValidFormat(password: string): boolean {
    return /^MFS_\d{7}$/.test(password);
  }

  extractClientId(password: string): string | null {
    const match = password.match(/^MFS_(\d{7})$/);
    return match?.[1] ?? null;
  }
}

export const passwordGenerator = new PasswordGenerator();
