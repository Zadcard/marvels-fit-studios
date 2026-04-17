import { describe, it, expect, beforeEach, vi } from "vitest";
import { BulkClientImportService } from "@/lib/services/bulk-client-import";
import * as prismaModule from "@/lib/prisma";

vi.mock("@/lib/prisma");
vi.mock("@/lib/services/client-registration-service");
vi.mock("@/lib/services/client-id-generator");

describe("BulkClientImportService", () => {
  let service: BulkClientImportService;
  let mockPrisma: any;
  let mockRegistrationService: any;

  beforeEach(async () => {
    mockPrisma = {};
    vi.mocked(prismaModule.getPrisma).mockReturnValue(mockPrisma);

    const regModule = await import(
      "@/lib/services/client-registration-service"
    );
    mockRegistrationService = {
      isPhoneAvailable: vi.fn().mockResolvedValue(true),
      registerClient: vi.fn().mockResolvedValue({
        userId: "user-123",
        clientId: "2605001",
        temporaryPassword: "MFS_2605001",
      }),
    };
    vi.mocked(regModule.clientRegistrationService, {
      partial: true,
    }).registerClient = mockRegistrationService.registerClient;
    vi.mocked(regModule.clientRegistrationService, {
      partial: true,
    }).isPhoneAvailable = mockRegistrationService.isPhoneAvailable;

    service = new BulkClientImportService();
  });

  describe("importClients", () => {
    it("should import single client successfully", async () => {
      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
          email: "john@example.com",
        },
      ]);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
    });

    it("should import multiple clients", async () => {
      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
        {
          fullName: "Jane Smith",
          phone: "+0987654321",
        },
        {
          fullName: "Bob Johnson",
          phone: "+1111111111",
        },
      ]);

      expect(result.successful).toBe(3);
      expect(result.total).toBe(3);
    });

    it("should handle duplicate phone in batch", async () => {
      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
        {
          fullName: "John Duplicate",
          phone: "+1234567890",
        },
      ]);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.duplicatePhones).toBe(1);
    });

    it("should handle phone already in system", async () => {
      mockRegistrationService.isPhoneAvailable.mockResolvedValueOnce(false);

      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
      ]);

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.duplicatePhones).toBe(1);
    });

    it("should track successful and failed records", async () => {
      mockRegistrationService.isPhoneAvailable
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
        {
          fullName: "Jane Smith",
          phone: "+0987654321",
        },
      ]);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.total).toBe(2);
    });

    it("should handle registration errors", async () => {
      mockRegistrationService.registerClient.mockRejectedValueOnce(
        new Error("Database error")
      );

      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
      ]);

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0].error).toContain("Database error");
    });

    it("should support optional email", async () => {
      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
      ]);

      expect(result.successful).toBe(1);
    });

    it("should pass data to registration service", async () => {
      await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
          email: "john@example.com",
        },
      ]);

      expect(mockRegistrationService.registerClient).toHaveBeenCalledWith({
        fullName: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
      });
    });

    it("should return client IDs and passwords in results", async () => {
      mockRegistrationService.registerClient.mockResolvedValue({
        userId: "user-456",
        clientId: "2605042",
        temporaryPassword: "MFS_2605042",
      });

      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
      ]);

      expect(result.results[0].clientId).toBe("2605042");
      expect(result.results[0].temporaryPassword).toBe("MFS_2605042");
    });

    it("should preserve original phone in results", async () => {
      const result = await service.importClients([
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
      ]);

      expect(result.results[0].phone).toBe("+1234567890");
    });
  });

  describe("importClientsFromCSV", () => {
    it("should parse basic CSV", async () => {
      const csv = `fullName,phone
John Doe,+1234567890
Jane Smith,+0987654321`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
    });

    it("should parse CSV with email column", async () => {
      const csv = `fullName,phone,email
John Doe,+1234567890,john@example.com
Jane Smith,+0987654321,jane@example.com`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
    });

    it("should handle quoted fields in CSV", async () => {
      const csv = `fullName,phone,email
"Doe, John",+1234567890,john@example.com
Jane Smith,+0987654321,jane@example.com`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(2);
    });

    it("should skip empty lines", async () => {
      const csv = `fullName,phone
John Doe,+1234567890

Jane Smith,+0987654321`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(2);
    });

    it("should handle case-insensitive headers", async () => {
      const csv = `FullName,Phone
John Doe,+1234567890
Jane Smith,+0987654321`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
    });

    it("should require fullName and phone columns", async () => {
      const csv = `email
john@example.com`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.results[0].error).toContain(
        "CSV must have fullName and phone"
      );
    });

    it("should return empty for single line CSV", async () => {
      const csv = `fullName,phone`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
    });

    it("should handle alternative header names", async () => {
      const csv = `name,phone
John Doe,+1234567890`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(1);
    });

    it("should preserve group information", async () => {
      const csv = `fullName,phone,group
John Doe,+1234567890,Premium`;

      const result = await service.importClientsFromCSV(csv);

      expect(result.total).toBe(1);
    });
  });

  describe("generateImportReport", () => {
    it("should generate report for successful imports", async () => {
      const stats = {
        total: 1,
        successful: 1,
        failed: 0,
        duplicatePhones: 0,
        results: [
          {
            success: true,
            clientId: "2605001",
            temporaryPassword: "MFS_2605001",
            fullName: "John Doe",
            phone: "+1234567890",
          },
        ],
      };

      const report = await service.generateImportReport(stats);

      expect(report).toContain("BULK CLIENT IMPORT REPORT");
      expect(report).toContain("Total Records: 1");
      expect(report).toContain("Successful: 1");
      expect(report).toContain("2605001");
      expect(report).toContain("MFS_2605001");
    });

    it("should include success rate", async () => {
      const stats = {
        total: 10,
        successful: 8,
        failed: 2,
        duplicatePhones: 2,
        results: [],
      };

      const report = await service.generateImportReport(stats);

      expect(report).toContain("Success Rate: 80.0%");
    });

    it("should include failed records section", async () => {
      const stats = {
        total: 2,
        successful: 1,
        failed: 1,
        duplicatePhones: 1,
        results: [
          {
            success: true,
            clientId: "2605001",
            temporaryPassword: "MFS_2605001",
            fullName: "John Doe",
            phone: "+1234567890",
          },
          {
            success: false,
            clientId: "",
            temporaryPassword: "",
            fullName: "Jane Smith",
            phone: "+0987654321",
            error: "Duplicate phone in import batch",
          },
        ],
      };

      const report = await service.generateImportReport(stats);

      expect(report).toContain("FAILED IMPORTS");
      expect(report).toContain("Duplicate phone in import batch");
    });

    it("should format report with consistent structure", async () => {
      const stats = {
        total: 3,
        successful: 2,
        failed: 1,
        duplicatePhones: 1,
        results: [
          {
            success: true,
            clientId: "2605001",
            temporaryPassword: "MFS_2605001",
            fullName: "John Doe",
            phone: "+1234567890",
          },
          {
            success: true,
            clientId: "2605002",
            temporaryPassword: "MFS_2605002",
            fullName: "Jane Smith",
            phone: "+0987654321",
          },
          {
            success: false,
            clientId: "",
            temporaryPassword: "",
            fullName: "Bob Johnson",
            phone: "+1111111111",
            error: "Duplicate phone",
          },
        ],
      };

      const report = await service.generateImportReport(stats);

      expect(report).toContain("SUCCESSFUL IMPORTS");
      expect(report).toContain("FAILED IMPORTS");
      expect(report).toContain("2605001");
      expect(report).toContain("2605002");
      expect(report).toContain("Duplicate phone");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete import workflow", async () => {
      const clientsData = [
        {
          fullName: "John Doe",
          phone: "+1234567890",
          email: "john@example.com",
        },
        {
          fullName: "Jane Smith",
          phone: "+0987654321",
        },
      ];

      const result = await service.importClients(clientsData);
      const report = await service.generateImportReport(result);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(report).toContain("Success Rate: 100.0%");
    });

    it("should handle CSV to import workflow", async () => {
      const csv = `fullName,phone,email
John Doe,+1234567890,john@example.com
Jane Smith,+0987654321,jane@example.com`;

      const result = await service.importClientsFromCSV(csv);
      const report = await service.generateImportReport(result);

      expect(result.successful).toBe(2);
      expect(report).toContain("Total Records: 2");
    });

    it("should prevent duplicate phone in batch import", async () => {
      const clientsData = [
        {
          fullName: "John Doe",
          phone: "+1234567890",
        },
        {
          fullName: "John Duplicate",
          phone: "+1234567890",
        },
        {
          fullName: "Jane Smith",
          phone: "+0987654321",
        },
      ];

      const result = await service.importClients(clientsData);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.duplicatePhones).toBe(1);
    });
  });
});
