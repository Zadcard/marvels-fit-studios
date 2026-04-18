import { describe, it, expect, beforeEach, vi } from "vitest";
import * as bcryptjs from "bcryptjs";

vi.mock("@/lib/prisma");
vi.mock("bcryptjs");
vi.mock("@/lib/services/client-id-generator");
vi.mock("@/lib/services/password-generator");

describe("ClientRegistrationService", () => {
  let ClientRegistrationService: any;
  let mockPrisma: any;
  let mockTx: any;
  let mockClientIdGenerator: any;
  let mockPasswordGenerator: any;
  let service: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockTx = {
      user: {
        create: vi.fn(),
      },
      client: {
        create: vi.fn(),
      },
    };

    mockPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      client: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockTx)),
    };

    const prismaModule = await import("@/lib/prisma");
    vi.mocked(prismaModule.getPrisma).mockReturnValue(mockPrisma);

    vi.mocked(bcryptjs.hash).mockResolvedValue("hashed_password" as never);

    mockClientIdGenerator = {
      getNextClientNumber: vi.fn().mockResolvedValue(1),
      generateId: vi.fn(({ clientNumber }: any) =>
        `2605${String(clientNumber || 1).padStart(3, "0")}`
      ),
    };

    mockPasswordGenerator = {
      generatePassword: vi.fn((clientId: string) => `MFS_${clientId}`),
    };

    const idGenModule = await import("@/lib/services/client-id-generator");
    vi.mocked(idGenModule, { partial: true }).clientIdGenerator =
      mockClientIdGenerator;

    const pwdGenModule = await import("@/lib/services/password-generator");
    vi.mocked(pwdGenModule, { partial: true }).passwordGenerator =
      mockPasswordGenerator;

    const {
      ClientRegistrationService: Cls,
    } = await import("@/lib/services/client-registration-service");
    service = new Cls();
  });

  describe("registerClient", () => {
    it("should create user and client in transaction", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result).toEqual({
        userId: "user-123",
        clientId: expect.stringMatching(/^\d{7}$/),
        temporaryPassword: expect.stringMatching(/^MFS_\d{7}$/),
      });
    });

    it("should generate client ID in format YYMMXXX", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      const result = await service.registerClient({
        fullName: "Jane Doe",
        phone: "+1987654321",
      });

      expect(result.clientId).toMatch(/^\d{7}$/);
      expect(result.clientId.length).toBe(7);
    });

    it("should generate temporary password matching client ID", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      const result = await service.registerClient({
        fullName: "Test Client",
        phone: "+1111111111",
      });

      expect(result.temporaryPassword).toBe(`MFS_${result.clientId}`);
    });

    it("should hash temporary password with bcryptjs", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "Hash Test",
        phone: "+1111111111",
      });

      expect(bcryptjs.hash).toHaveBeenCalledWith(
        expect.stringMatching(/^MFS_\d{7}$/),
        10
      );
    });

    it("should create user with hashed password", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data).toEqual({
        clientId: expect.stringMatching(/^\d{7}$/),
        email: null,
        password: "hashed_password",
        role: "CLIENT",
      });
    });

    it("should create client with provided data", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      const clientCreateCall = mockTx.client.create.mock.calls[0][0];
      expect(clientCreateCall.data).toEqual({
        userId: "user-123",
        fullName: "John Doe",
        phone: "+1234567890",
        status: "ACTIVE",
      });
    });

    it("should set user role to CLIENT", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "Test User",
        phone: "+1111111111",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data.role).toBe("CLIENT");
    });

    it("should set client status to ACTIVE", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "Test User",
        phone: "+1111111111",
      });

      const clientCreateCall = mockTx.client.create.mock.calls[0][0];
      expect(clientCreateCall.data.status).toBe("ACTIVE");
    });

    it("should include email if provided", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data.email).toBe("john@example.com");
    });

    it("should set email to null if not provided", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "Jane Doe",
        phone: "+1234567890",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data.email).toBeNull();
    });

    it("should return user ID from transaction", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-456",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result.userId).toBe("user-456");
    });

    it("should execute within transaction", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should hash password with correct bcrypt rounds", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      const hashCall = vi.mocked(bcryptjs.hash).mock.calls[0];
      expect(hashCall[1]).toBe(10);
    });
  });

  describe("isPhoneAvailable", () => {
    it("should return true when phone is not registered", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const available = await service.isPhoneAvailable("+1234567890");

      expect(available).toBe(true);
    });

    it("should return false when phone is registered", async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: "client-123",
        phone: "+1234567890",
      });

      const available = await service.isPhoneAvailable("+1234567890");

      expect(available).toBe(false);
    });

    it("should check phone uniqueness in database", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await service.isPhoneAvailable("+1234567890");

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { phone: "+1234567890" },
      });
    });

    it("should work with different phone formats", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const phones = ["+1234567890", "201012345678", "0101234567"];
      for (const phone of phones) {
        const available = await service.isPhoneAvailable(phone);
        expect(available).toBe(true);
      }
    });

    it("should return false if client exists", async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: "existing-client",
        fullName: "Existing User",
        phone: "+1234567890",
      });

      const available = await service.isPhoneAvailable("+1234567890");

      expect(available).toBe(false);
    });

    it("should query by phone field", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await service.isPhoneAvailable("+1234567890");

      const callArgs = mockPrisma.client.findUnique.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty("phone", "+1234567890");
    });
  });

  describe("integration scenarios", () => {
    it("should allow registration if phone is available", async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      const phoneAvailable = await service.isPhoneAvailable("+1234567890");
      expect(phoneAvailable).toBe(true);

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("clientId");
      expect(result).toHaveProperty("temporaryPassword");
    });

    it("should prevent registration if phone is taken", async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: "existing-client",
      });

      const phoneAvailable = await service.isPhoneAvailable("+1234567890");
      expect(phoneAvailable).toBe(false);
    });

    it("should return all required fields in registration result", async () => {
      mockTx.user.create.mockResolvedValue({
        id: "user-123",
      });
      mockTx.client.create.mockResolvedValue({
        id: "client-123",
      });

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("clientId");
      expect(result).toHaveProperty("temporaryPassword");

      expect(typeof result.userId).toBe("string");
      expect(typeof result.clientId).toBe("string");
      expect(typeof result.temporaryPassword).toBe("string");
    });
  });
});
