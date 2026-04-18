import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { BcryptPasswordVerifier } from './password-verifier';

vi.mock('bcryptjs');

describe('Password Verifier', () => {
  let verifier: BcryptPasswordVerifier;

  beforeEach(() => {
    verifier = new BcryptPasswordVerifier();
    vi.clearAllMocks();
  });

  describe('BcryptPasswordVerifier.verify', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'correct-password';
      const passwordHash = '$2a$10$mocked.hash';

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await verifier.verify(plainPassword, passwordHash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, passwordHash);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'wrong-password';
      const passwordHash = '$2a$10$mocked.hash';

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await verifier.verify(plainPassword, passwordHash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, passwordHash);
    });

    it('should call bcrypt.compare with correct arguments', async () => {
      const plainPassword = 'test-password';
      const passwordHash = '$2a$10$test.hash';

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await verifier.verify(plainPassword, passwordHash);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, passwordHash);
    });

    it('should handle bcrypt errors', async () => {
      const plainPassword = 'password';
      const passwordHash = 'invalid-hash';
      const error = new Error('Invalid hash');

      vi.mocked(bcrypt.compare).mockRejectedValue(error);

      await expect(verifier.verify(plainPassword, passwordHash)).rejects.toThrow('Invalid hash');
    });

    it('should support empty password verification', async () => {
      const plainPassword = '';
      const passwordHash = '$2a$10$hash';

      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await verifier.verify(plainPassword, passwordHash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, passwordHash);
    });

    it('should support very long passwords', async () => {
      const plainPassword = 'a'.repeat(500);
      const passwordHash = '$2a$10$hash';

      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await verifier.verify(plainPassword, passwordHash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, passwordHash);
    });

    it('should be an instance of BcryptPasswordVerifier', () => {
      expect(verifier).toBeInstanceOf(BcryptPasswordVerifier);
    });

    it('should have proper async return type', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = verifier.verify('password', 'hash');

      expect(result).toBeInstanceOf(Promise);
      expect(await result).toBe(true);
    });
  });
});
