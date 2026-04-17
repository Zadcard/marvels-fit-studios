import "server-only";

import { clientRegistrationService } from "@/lib/services/client-registration-service";
import {
  clientRegistrationSchema,
  normalizePhoneNumber,
} from "@/lib/validators/id-auth";

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

export type BulkClientInput = {
  fullName: string;
  phone: string;
};

export type BulkClientPreviewRow = BulkClientInput & {
  rowNumber: number;
  valid: boolean;
  reason?: string;
};

export type BulkClientImportSuccess = BulkClientInput & {
  rowNumber: number;
  clientId: string;
  password: string;
};

export type BulkClientImportFailure = BulkClientInput & {
  rowNumber: number;
  reason: string;
};

export type BulkClientImportStats = {
  total: number;
  successful: number;
  failed: number;
  duplicatePhones: number;
  results: ImportResult[];
  totalRecords: number;
  successfulImports: BulkClientImportSuccess[];
  failedImports: BulkClientImportFailure[];
  successRate: number;
};

export type BulkClientImportReport = BulkClientImportStats & {
  credentialsCsv: string;
  summary: string;
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function toCsvValue(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function createStats(
  rows: BulkClientPreviewRow[],
  successfulImports: BulkClientImportSuccess[],
  failedImports: BulkClientImportFailure[]
): BulkClientImportStats {
  const totalRecords = rows.length;
  const successRate =
    totalRecords === 0
      ? 0
      : Math.round((successfulImports.length / totalRecords) * 10000) / 100;
  const duplicatePhones = failedImports.filter((failure) =>
    failure.reason.toLowerCase().includes("duplicate")
  ).length;

  return {
    total: totalRecords,
    successful: successfulImports.length,
    failed: failedImports.length,
    duplicatePhones,
    results: [
      ...successfulImports.map((client) => ({
        success: true,
        clientId: client.clientId,
        temporaryPassword: client.password,
        fullName: client.fullName,
        phone: client.phone,
      })),
      ...failedImports.map((client) => ({
        success: false,
        clientId: "",
        temporaryPassword: "",
        fullName: client.fullName,
        phone: client.phone,
        error: client.reason,
      })),
    ],
    totalRecords,
    successfulImports,
    failedImports,
    successRate,
  };
}

export class BulkClientImportService {
  parseClientsFromCSV(csvContent: string): BulkClientPreviewRow[] {
    const lines = csvContent
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return [];
    }

    const firstRow = parseCsvLine(lines[0]).map((value) =>
      value.toLowerCase()
    );
    const hasHeader =
      firstRow.includes("fullname") ||
      firstRow.includes("full name") ||
      firstRow.includes("name") ||
      firstRow.includes("phone");
    const fullNameIndex = Math.max(
      firstRow.indexOf("fullname"),
      firstRow.indexOf("full name"),
      firstRow.indexOf("name")
    );
    const phoneIndex = firstRow.indexOf("phone");
    const records = hasHeader ? lines.slice(1) : lines;
    const seenPhones = new Map<string, number>();

    if (
      (hasHeader && (fullNameIndex < 0 || phoneIndex < 0)) ||
      (!hasHeader && firstRow.length < 2)
    ) {
      return [
        {
          fullName: "",
          phone: "",
          rowNumber: 1,
          valid: false,
          reason: "CSV must have fullName and phone columns.",
        },
      ];
    }

    return records.map((line, index) => {
      const values = parseCsvLine(line);
      const fullName = hasHeader
        ? values[fullNameIndex] ?? ""
        : values[0] ?? "";
      const phone = hasHeader ? values[phoneIndex] ?? "" : values[1] ?? "";
      const normalizedInput = {
        fullName: fullName.trim(),
        phone: normalizePhoneNumber(phone),
      };
      const parsed = clientRegistrationSchema.safeParse(normalizedInput);
      const rowNumber = hasHeader ? index + 2 : index + 1;

      if (!parsed.success) {
        return {
          ...normalizedInput,
          rowNumber,
          valid: false,
          reason: parsed.error.issues[0]?.message ?? "Invalid client record.",
        };
      }

      const earlierRow = seenPhones.get(parsed.data.phone);
      if (earlierRow) {
        return {
          ...parsed.data,
          rowNumber,
          valid: false,
          reason: `Duplicate phone number from row ${earlierRow}.`,
        };
      }

      seenPhones.set(parsed.data.phone, rowNumber);

      return {
        ...parsed.data,
        rowNumber,
        valid: true,
      };
    });
  }

  async importClients(
    clientsData: ClientImportData[]
  ): Promise<BulkClientImportStats> {
    const csv = [
      "fullName,phone",
      ...clientsData.map((client) =>
        [client.fullName, client.phone].map(toCsvValue).join(",")
      ),
    ].join("\n");

    return this.importClientsFromCSV(csv);
  }

  async importClientsFromCSV(
    csvContent: string
  ): Promise<BulkClientImportStats> {
    const rows = this.parseClientsFromCSV(csvContent);
    const successfulImports: BulkClientImportSuccess[] = [];
    const failedImports: BulkClientImportFailure[] = [];

    for (const row of rows) {
      if (!row.valid) {
        failedImports.push({
          fullName: row.fullName,
          phone: row.phone,
          rowNumber: row.rowNumber,
          reason: row.reason ?? "Invalid client record.",
        });
        continue;
      }

      try {
        const phoneAvailable = await clientRegistrationService.isPhoneAvailable(
          row.phone
        );

        if (!phoneAvailable) {
          failedImports.push({
            fullName: row.fullName,
            phone: row.phone,
            rowNumber: row.rowNumber,
            reason: "Phone number is already registered.",
          });
          continue;
        }

        const result = await clientRegistrationService.registerClient({
          fullName: row.fullName,
          phone: row.phone,
        });

        successfulImports.push({
          fullName: row.fullName,
          phone: row.phone,
          rowNumber: row.rowNumber,
          clientId: result.clientId,
          password: result.temporaryPassword,
        });
      } catch (error) {
        failedImports.push({
          fullName: row.fullName,
          phone: row.phone,
          rowNumber: row.rowNumber,
          reason: error instanceof Error ? error.message : "Import failed.",
        });
      }
    }

    return createStats(rows, successfulImports, failedImports);
  }

  generateImportReport(stats: BulkClientImportStats): BulkClientImportReport {
    const credentialsCsv = [
      ["clientId", "fullName", "phone", "password"].join(","),
      ...stats.successfulImports.map((client) =>
        [client.clientId, client.fullName, client.phone, client.password]
          .map(toCsvValue)
          .join(",")
      ),
    ].join("\n");

    return {
      ...stats,
      credentialsCsv,
      summary: `${stats.successfulImports.length}/${stats.totalRecords} clients imported (${stats.successRate}%).`,
    };
  }
}

export const bulkClientImportService = new BulkClientImportService();
