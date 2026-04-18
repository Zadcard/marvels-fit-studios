import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/client-registration-service", () => ({
  clientRegistrationService: {
    isPhoneAvailable: vi.fn(),
    registerClient: vi.fn(),
  },
}));

describe("BulkClientImportService", () => {
  let service: import("@/lib/services/bulk-client-import").BulkClientImportService;
  let clientRegistrationService: typeof import("@/lib/services/client-registration-service").clientRegistrationService;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ clientRegistrationService } = await import(
      "@/lib/services/client-registration-service"
    ));
    const bulkImportModule = await import("@/lib/services/bulk-client-import");
    service = new bulkImportModule.BulkClientImportService();
  });

  it("parses CSV rows and detects duplicate phones", () => {
    const rows = service.parseClientsFromCSV(
      "fullName,phone\nJohn Doe,01012345678\nJane Doe,+201012345678"
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      fullName: "John Doe",
      phone: "+201012345678",
      valid: true,
    });
    expect(rows[1]).toMatchObject({
      valid: false,
      reason: "Duplicate phone number from row 2.",
    });
  });

  it("rejects CSV without fullName and phone headers", () => {
    const rows = service.parseClientsFromCSV("email\njohn@example.com");

    expect(rows[0]).toMatchObject({
      valid: false,
      reason: "CSV must have fullName and phone columns.",
    });
  });

  it("imports valid clients and records generated credentials", async () => {
    vi.mocked(clientRegistrationService.isPhoneAvailable).mockResolvedValue(
      true
    );
    vi.mocked(clientRegistrationService.registerClient).mockResolvedValue({
      userId: "user-1",
      clientId: "2605001",
      temporaryPassword: "MFS_2605001",
    });

    const stats = await service.importClientsFromCSV(
      "fullName,phone\nJohn Doe,01012345678"
    );

    expect(stats.totalRecords).toBe(1);
    expect(stats.total).toBe(1);
    expect(stats.successful).toBe(1);
    expect(stats.successfulImports).toEqual([
      {
        rowNumber: 2,
        fullName: "John Doe",
        phone: "+201012345678",
        clientId: "2605001",
        password: "MFS_2605001",
      },
    ]);
    expect(stats.results[0]).toMatchObject({
      success: true,
      temporaryPassword: "MFS_2605001",
    });
    expect(stats.successRate).toBe(100);
  });

  it("imports array data through the same no-email registration path", async () => {
    vi.mocked(clientRegistrationService.isPhoneAvailable).mockResolvedValue(
      true
    );
    vi.mocked(clientRegistrationService.registerClient).mockResolvedValue({
      userId: "user-1",
      clientId: "2605001",
      temporaryPassword: "MFS_2605001",
    });

    await service.importClients([
      {
        fullName: "John Doe",
        phone: "01012345678",
        email: "ignored@example.com",
      },
    ]);

    expect(clientRegistrationService.registerClient).toHaveBeenCalledWith({
      fullName: "John Doe",
      phone: "+201012345678",
    });
  });

  it("fails rows when phone already exists", async () => {
    vi.mocked(clientRegistrationService.isPhoneAvailable).mockResolvedValue(
      false
    );

    const stats = await service.importClientsFromCSV(
      "fullName,phone\nJohn Doe,01012345678"
    );

    expect(stats.successfulImports).toHaveLength(0);
    expect(stats.failed).toBe(1);
    expect(stats.failedImports[0]).toMatchObject({
      rowNumber: 2,
      reason: "Phone number is already registered.",
    });
  });

  it("generates credentials CSV report", () => {
    const report = service.generateImportReport({
      total: 1,
      successful: 1,
      failed: 0,
      duplicatePhones: 0,
      results: [],
      totalRecords: 1,
      successfulImports: [
        {
          rowNumber: 2,
          fullName: "John Doe",
          phone: "+201012345678",
          clientId: "2605001",
          password: "MFS_2605001",
        },
      ],
      failedImports: [],
      successRate: 100,
    });

    expect(report.summary).toBe("1/1 clients imported (100%).");
    expect(report.credentialsCsv).toContain(
      "2605001,John Doe,+201012345678,MFS_2605001"
    );
  });
});
