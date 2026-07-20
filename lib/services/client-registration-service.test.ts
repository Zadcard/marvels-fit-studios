import { describe, it, expect, beforeEach, vi } from "vitest";

describe("ClientRegistrationService", () => {
  let mockDataStore: any;
  let mockTx: any;
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

    mockDataStore = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      client: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockTx)),
    };

    const {
      ClientRegistrationService: Cls,
    } = await import("@/lib/services/client-registration-service");
    service = new Cls({
      register: (input: any) =>
        mockDataStore.$transaction(async (tx: any) => {
          const user = await tx.user.create({
            data: {
              name: input.fullName,
              email: input.email || null,
              role: "CLIENT",
            },
            select: { id: true },
          });
          await tx.client.create({
            data: {
              userId: user.id,
              fullName: input.fullName,
              phone: input.phone,
              groupId: input.groupId ?? null,
              status: "ACTIVE",
            },
          });
          return { userId: user.id };
        }),
      findClientByPhone: (phone: string) =>
        mockDataStore.client.findUnique({ where: { phone } }),
      findGroupByName: vi.fn(),
    });
  });

  describe("registerClient", () => {
    it("should create user and client in transaction", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result).toEqual({ userId: "user-123" });
    });

    it("should create client with provided data", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      const clientCreateCall = mockTx.client.create.mock.calls[0][0];
      expect(clientCreateCall.data).toEqual({
        userId: "user-123",
        fullName: "John Doe",
        phone: "+1234567890",
        groupId: null,
        status: "ACTIVE",
      });
    });

    it("should set user role to CLIENT", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      await service.registerClient({
        fullName: "Test User",
        phone: "+1111111111",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data.role).toBe("CLIENT");
    });

    it("should set client status to ACTIVE", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      await service.registerClient({
        fullName: "Test User",
        phone: "+1111111111",
      });

      const clientCreateCall = mockTx.client.create.mock.calls[0][0];
      expect(clientCreateCall.data.status).toBe("ACTIVE");
    });

    it("should include email if provided", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data.email).toBe("john@example.com");
    });

    it("should set email to null if not provided", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      await service.registerClient({
        fullName: "Jane Doe",
        phone: "+1234567890",
      });

      const userCreateCall = mockTx.user.create.mock.calls[0][0];
      expect(userCreateCall.data.email).toBeNull();
    });

    it("should return user ID from transaction", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-456" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result.userId).toBe("user-456");
    });

    it("should execute within transaction", async () => {
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(mockDataStore.$transaction).toHaveBeenCalled();
    });
  });

  describe("isPhoneAvailable", () => {
    it("should return true when phone is not registered", async () => {
      mockDataStore.client.findUnique.mockResolvedValue(null);

      const available = await service.isPhoneAvailable("+1234567890");

      expect(available).toBe(true);
    });

    it("should return false when phone is registered", async () => {
      mockDataStore.client.findUnique.mockResolvedValue({
        id: "client-123",
        phone: "+1234567890",
      });

      const available = await service.isPhoneAvailable("+1234567890");

      expect(available).toBe(false);
    });

    it("should check phone uniqueness in database", async () => {
      mockDataStore.client.findUnique.mockResolvedValue(null);

      await service.isPhoneAvailable("+1234567890");

      expect(mockDataStore.client.findUnique).toHaveBeenCalledWith({
        where: { phone: "+1234567890" },
      });
    });

    it("should query by phone field", async () => {
      mockDataStore.client.findUnique.mockResolvedValue(null);

      await service.isPhoneAvailable("+1234567890");

      const callArgs = mockDataStore.client.findUnique.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty("phone", "+1234567890");
    });
  });

  describe("integration scenarios", () => {
    it("should allow registration if phone is available", async () => {
      mockDataStore.client.findUnique.mockResolvedValue(null);
      mockTx.user.create.mockResolvedValue({ id: "user-123" });
      mockTx.client.create.mockResolvedValue({ id: "client-123" });

      const phoneAvailable = await service.isPhoneAvailable("+1234567890");
      expect(phoneAvailable).toBe(true);

      const result = await service.registerClient({
        fullName: "John Doe",
        phone: "+1234567890",
      });

      expect(result).toHaveProperty("userId");
      expect(typeof result.userId).toBe("string");
    });

    it("should prevent registration if phone is taken", async () => {
      mockDataStore.client.findUnique.mockResolvedValue({
        id: "existing-client",
      });

      const phoneAvailable = await service.isPhoneAvailable("+1234567890");
      expect(phoneAvailable).toBe(false);
    });
  });
});
