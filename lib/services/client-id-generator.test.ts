import { describe, it, expect, beforeEach, vi } from "vitest";
import { ClientIdGenerator } from "@/lib/services/client-id-generator";

describe("ClientIdGenerator", () => {
  let generator: ClientIdGenerator;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
      },
    };
    generator = new ClientIdGenerator(async (prefix) =>
      mockPrisma.user.findFirst({
        where: { clientId: { startsWith: prefix } },
        orderBy: { clientId: "desc" },
        select: { clientId: true },
      })
    );
  });

  describe("generateId", () => {
    it("should generate ID in format YYMMXXX", () => {
      const id = generator.generateId({
        year: 2026,
        month: 5,
        clientNumber: 20,
      });
      expect(id).toBe("2605020");
    });

    it("should use current date when no options provided", () => {
      const id = generator.generateId();
      expect(id).toMatch(/^\d{7}$/);
    });

    it("should pad month with zero", () => {
      const id = generator.generateId({
        year: 2026,
        month: 1,
        clientNumber: 5,
      });
      expect(id).toBe("2601005");
    });

    it("should pad client number with zeros", () => {
      const id = generator.generateId({
        year: 2026,
        month: 5,
        clientNumber: 1,
      });
      expect(id).toBe("2605001");
    });

    it("should handle three-digit client numbers", () => {
      const id = generator.generateId({
        year: 2026,
        month: 5,
        clientNumber: 999,
      });
      expect(id).toBe("2605999");
    });

    it("should extract last two digits of year", () => {
      const id = generator.generateId({
        year: 2026,
        month: 5,
        clientNumber: 10,
      });
      expect(id.slice(0, 2)).toBe("26");
    });

    it("should default to month 1 when year is 2000", () => {
      const id = generator.generateId({
        year: 2000,
        month: 5,
        clientNumber: 10,
      });
      expect(id).toBe("0005010");
    });

    it("should handle December correctly", () => {
      const id = generator.generateId({
        year: 2026,
        month: 12,
        clientNumber: 50,
      });
      expect(id).toBe("2612050");
    });

    it("should reject client numbers above 999", () => {
      expect(() =>
        generator.generateId({
          year: 2026,
          month: 5,
          clientNumber: 1000,
        })
      ).toThrow("Client number must be between 1 and 999");
    });
  });

  describe("parseId", () => {
    it("should parse valid ID correctly", () => {
      const parsed = generator.parseId("2605020");
      expect(parsed).toEqual({
        year: 2026,
        month: 5,
        clientNumber: 20,
        joinDate: expect.any(Date),
      });
    });

    it("should extract year correctly", () => {
      const parsed = generator.parseId("2605020");
      expect(parsed.year).toBe(2026);
    });

    it("should extract month correctly", () => {
      const parsed = generator.parseId("2605020");
      expect(parsed.month).toBe(5);
    });

    it("should extract client number correctly", () => {
      const parsed = generator.parseId("2605020");
      expect(parsed.clientNumber).toBe(20);
    });

    it("should set joinDate to first day of month", () => {
      const parsed = generator.parseId("2605020");
      expect(parsed.joinDate.getFullYear()).toBe(2026);
      expect(parsed.joinDate.getMonth()).toBe(4); // month is 0-indexed
      expect(parsed.joinDate.getDate()).toBe(1);
    });

    it("should throw error for invalid format", () => {
      expect(() => generator.parseId("260502")).toThrow(
        "Invalid client ID format"
      );
    });

    it("should throw error for non-numeric ID", () => {
      expect(() => generator.parseId("26050AB")).toThrow(
        "Invalid client ID format"
      );
    });

    it("should throw error for month 0", () => {
      expect(() => generator.parseId("2600020")).toThrow(
        "Invalid month in client ID"
      );
    });

    it("should throw error for month 13", () => {
      expect(() => generator.parseId("2613020")).toThrow(
        "Invalid month in client ID"
      );
    });

    it("should handle January (01) correctly", () => {
      const parsed = generator.parseId("2601100");
      expect(parsed.month).toBe(1);
    });

    it("should handle December (12) correctly", () => {
      const parsed = generator.parseId("2612100");
      expect(parsed.month).toBe(12);
    });

    it("should parse client number 001 correctly", () => {
      const parsed = generator.parseId("2605001");
      expect(parsed.clientNumber).toBe(1);
    });

    it("should parse client number 999 correctly", () => {
      const parsed = generator.parseId("2605999");
      expect(parsed.clientNumber).toBe(999);
    });
  });

  describe("getNextClientNumber", () => {
    it("should return 1 when no clients exist", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const nextNumber = await generator.getNextClientNumber();

      expect(nextNumber).toBe(1);
    });

    it("should return incremented number", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        clientId: "2605020",
      });

      const nextNumber = await generator.getNextClientNumber();

      expect(nextNumber).toBe(21);
    });

    it("should filter by month prefix", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        clientId: "2605015",
      });

      const nextNumber = await generator.getNextClientNumber();

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          clientId: {
            startsWith: expect.stringMatching(/^\d{4}$/),
          },
        },
        orderBy: { clientId: "desc" },
        select: { clientId: true },
      });

      expect(nextNumber).toBe(16);
    });

    it("should accept custom month and year", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await generator.getNextClientNumber(3, 2025);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          clientId: {
            startsWith: "2503",
          },
        },
        orderBy: { clientId: "desc" },
        select: { clientId: true },
      });
    });

    it("should handle different months separately", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        clientId: "2604050",
      });

      const nextNumber = await generator.getNextClientNumber(4);

      expect(nextNumber).toBe(51);
    });

    it("should pad month in query", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await generator.getNextClientNumber(1);

      const callArgs = mockPrisma.user.findFirst.mock.calls[0][0];
      expect(callArgs.where.clientId.startsWith).toMatch(/2601/);
    });

    it("should handle client number at boundary (999)", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        clientId: "2605999",
      });

      const nextNumber = await generator.getNextClientNumber();

      expect(nextNumber).toBe(1000);
    });

    it("should use current month when not specified", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await generator.getNextClientNumber();

      const now = new Date();
      const yearStr = now.getFullYear().toString().slice(-2);
      const monthStr = String(now.getMonth() + 1).padStart(2, "0");

      const callArgs = mockPrisma.user.findFirst.mock.calls[0][0];
      expect(callArgs.where.clientId.startsWith).toBe(`${yearStr}${monthStr}`);
    });

    it("should order by clientId descending to get latest", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        clientId: "2605050",
      });

      await generator.getNextClientNumber();

      const callArgs = mockPrisma.user.findFirst.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual({ clientId: "desc" });
    });
  });

  describe("roundtrip generation and parsing", () => {
    it("should generate and parse consistently", () => {
      const id = generator.generateId({
        year: 2026,
        month: 5,
        clientNumber: 20,
      });
      const parsed = generator.parseId(id);

      expect(parsed.year).toBe(2026);
      expect(parsed.month).toBe(5);
      expect(parsed.clientNumber).toBe(20);
    });

    it("should handle all valid month combinations", () => {
      for (let month = 1; month <= 12; month++) {
        const id = generator.generateId({
          year: 2026,
          month,
          clientNumber: 50,
        });
        const parsed = generator.parseId(id);
        expect(parsed.month).toBe(month);
      }
    });

    it("should handle client numbers 1-999", () => {
      for (const clientNum of [1, 50, 100, 500, 999]) {
        const id = generator.generateId({
          year: 2026,
          month: 5,
          clientNumber: clientNum,
        });
        const parsed = generator.parseId(id);
        expect(parsed.clientNumber).toBe(clientNum);
      }
    });
  });

  describe("getNextAvailableId", () => {
    it("should keep the current month when capacity remains", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        clientId: "2605042",
      });

      const nextId = await generator.getNextAvailableId(5, 2026);

      expect(nextId).toBe("2605043");
    });

    it("should roll over to the next month when the current month is full", async () => {
      mockPrisma.user.findFirst
        .mockResolvedValueOnce({
          clientId: "2604999",
        })
        .mockResolvedValueOnce(null);

      const nextId = await generator.getNextAvailableId(4, 2026);

      expect(nextId).toBe("2605001");
    });

    it("should roll over from December into January of the next year", async () => {
      mockPrisma.user.findFirst
        .mockResolvedValueOnce({
          clientId: "2612999",
        })
        .mockResolvedValueOnce(null);

      const nextId = await generator.getNextAvailableId(12, 2026);

      expect(nextId).toBe("2701001");
    });
  });
});
