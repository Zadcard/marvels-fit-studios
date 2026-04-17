import { getPrisma } from "@/lib/prisma";
import { clientRegistrationService } from "@/lib/services/client-registration-service";
import { clientIdGenerator } from "@/lib/services/client-id-generator";

export interface ClientImportData {
  fullName: string;
  phone: string;
  email?: string;
  groupName?: string;
}

export interface ImportResult {
  success: boolean;
  clientId: string;
  temporaryPassword: string;
  fullName: string;
  phone: string;
  error?: string;
}

export interface BulkImportStats {
  total: number;
  successful: number;
  failed: number;
  duplicatePhones: number;
  results: ImportResult[];
}

export class BulkClientImportService {
  private prisma = getPrisma();

  async importClients(
    clientsData: ClientImportData[]
  ): Promise<BulkImportStats> {
    const stats: BulkImportStats = {
      total: clientsData.length,
      successful: 0,
      failed: 0,
      duplicatePhones: 0,
      results: [],
    };

    const phoneTracker = new Set<string>();

    for (const clientData of clientsData) {
      try {
        const normalizedPhone = this.normalizePhone(clientData.phone);

        if (phoneTracker.has(normalizedPhone)) {
          stats.duplicatePhones++;
          stats.failed++;
          stats.results.push({
            success: false,
            clientId: "",
            temporaryPassword: "",
            fullName: clientData.fullName,
            phone: clientData.phone,
            error: "Duplicate phone in import batch",
          });
          continue;
        }

        const isAvailable = await clientRegistrationService.isPhoneAvailable(
          normalizedPhone
        );

        if (!isAvailable) {
          stats.duplicatePhones++;
          stats.failed++;
          stats.results.push({
            success: false,
            clientId: "",
            temporaryPassword: "",
            fullName: clientData.fullName,
            phone: clientData.phone,
            error: "Phone number already exists in system",
          });
          continue;
        }

        const result = await clientRegistrationService.registerClient({
          fullName: clientData.fullName,
          phone: normalizedPhone,
          email: clientData.email,
        });

        phoneTracker.add(normalizedPhone);
        stats.successful++;
        stats.results.push({
          success: true,
          clientId: result.clientId,
          temporaryPassword: result.temporaryPassword,
          fullName: clientData.fullName,
          phone: clientData.phone,
        });
      } catch (error) {
        stats.failed++;
        stats.results.push({
          success: false,
          clientId: "",
          temporaryPassword: "",
          fullName: clientData.fullName,
          phone: clientData.phone,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    return stats;
  }

  async importClientsFromCSV(csvContent: string): Promise<BulkImportStats> {
    const lines = csvContent.trim().split("\n");

    if (lines.length < 2) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        duplicatePhones: 0,
        results: [],
      };
    }

    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine.toLowerCase());

    const fullNameIndex = Math.max(
      headers.indexOf("fullname"),
      headers.indexOf("name")
    );
    const phoneIndex = headers.indexOf("phone");
    const emailIndex = headers.indexOf("email");
    const groupIndex = headers.indexOf("group");

    if (fullNameIndex === -1 || phoneIndex === -1) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        duplicatePhones: 0,
        results: [
          {
            success: false,
            clientId: "",
            temporaryPassword: "",
            fullName: "",
            phone: "",
            error: "CSV must have fullName and phone columns",
          },
        ],
      };
    }

    const clientsData: ClientImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);

      clientsData.push({
        fullName: values[fullNameIndex] || "",
        phone: values[phoneIndex] || "",
        email:
          emailIndex >= 0 && values[emailIndex]
            ? values[emailIndex]
            : undefined,
        groupName:
          groupIndex >= 0 && values[groupIndex]
            ? values[groupIndex]
            : undefined,
      });
    }

    return this.importClients(clientsData);
  }

  private normalizePhone(phone: string): string {
    return phone.trim();
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  async generateImportReport(stats: BulkImportStats): Promise<string> {
    const lines: string[] = [];

    lines.push("=== BULK CLIENT IMPORT REPORT ===\n");
    lines.push(`Total Records: ${stats.total}`);
    lines.push(`Successful: ${stats.successful}`);
    lines.push(`Failed: ${stats.failed}`);
    lines.push(`Duplicate Phones: ${stats.duplicatePhones}`);
    lines.push(`Success Rate: ${((stats.successful / stats.total) * 100).toFixed(1)}%\n`);

    if (stats.successful > 0) {
      lines.push("--- SUCCESSFUL IMPORTS ---");
      for (const result of stats.results.filter((r) => r.success)) {
        lines.push(
          `${result.fullName} | Phone: ${result.phone} | ID: ${result.clientId} | Password: ${result.temporaryPassword}`
        );
      }
      lines.push("");
    }

    if (stats.failed > 0) {
      lines.push("--- FAILED IMPORTS ---");
      for (const result of stats.results.filter((r) => !r.success)) {
        lines.push(
          `${result.fullName} | Phone: ${result.phone} | Error: ${result.error}`
        );
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}

export const bulkClientImportService = new BulkClientImportService();
