import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface ClientIdGeneratorOptions {
  year?: number;
  month?: number;
  clientNumber?: number;
}

export interface ParsedClientId {
  year: number;
  month: number;
  clientNumber: number;
  joinDate: Date;
}

export interface NextClientIdSlot {
  year: number;
  month: number;
  clientNumber: number;
}

export type LatestClientIdFinder = (
  prefix: string
) => Promise<{ clientId: string | null } | null>;

async function findLatestClientId(prefix: string) {
  const { data, error } = await getSupabaseServerClient()
    .from("User")
    .select("clientId")
    .like("clientId", `${prefix}%`)
    .order("clientId", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export class ClientIdGenerator {
  constructor(private readonly latestClientIdFinder: LatestClientIdFinder = findLatestClientId) {}

  private normalizeDateParts(month?: number, year?: number) {
    const now = new Date();
    return {
      year: year || now.getFullYear(),
      month: month || now.getMonth() + 1,
    };
  }

  private incrementMonth(slot: Pick<NextClientIdSlot, "month" | "year">) {
    if (slot.month === 12) {
      return {
        year: slot.year + 1,
        month: 1,
      };
    }

    return {
      year: slot.year,
      month: slot.month + 1,
    };
  }

  generateId(options?: ClientIdGeneratorOptions): string {
    const now = new Date();
    const resolvedYear = options?.year || now.getFullYear();
    const resolvedMonth = options?.month || now.getMonth() + 1;
    const resolvedClientNumber = options?.clientNumber || 1;

    if (resolvedMonth < 1 || resolvedMonth > 12) {
      throw new Error("Invalid month for client ID generation");
    }

    if (resolvedClientNumber < 1 || resolvedClientNumber > 999) {
      throw new Error("Client number must be between 1 and 999");
    }

    const year = resolvedYear.toString().slice(-2);
    const month = String(resolvedMonth).padStart(2, "0");
    const clientNum = String(resolvedClientNumber).padStart(3, "0");

    return `${year}${month}${clientNum}`;
  }

  parseId(clientId: string): ParsedClientId {
    if (!/^\d{7}$/.test(clientId)) {
      throw new Error("Invalid client ID format");
    }

    const year = 2000 + parseInt(clientId.slice(0, 2), 10);
    const month = parseInt(clientId.slice(2, 4), 10);
    const clientNumber = parseInt(clientId.slice(4, 7), 10);

    if (month < 1 || month > 12) {
      throw new Error("Invalid month in client ID");
    }

    return {
      year,
      month,
      clientNumber,
      joinDate: new Date(year, month - 1, 1),
    };
  }

  async getNextClientNumber(month?: number, year?: number): Promise<number> {
    const { year: targetYear, month: targetMonth } = this.normalizeDateParts(
      month,
      year
    );

    const yearStr = targetYear.toString().slice(-2);
    const monthStr = String(targetMonth).padStart(2, "0");
    const prefix = `${yearStr}${monthStr}`;

    const latestClient = await this.latestClientIdFinder(prefix);

    if (!latestClient?.clientId) {
      return 1;
    }

    const currentNumber = parseInt(latestClient.clientId.slice(4, 7), 10);
    return currentNumber + 1;
  }

  async getNextAvailableSlot(
    month?: number,
    year?: number
  ): Promise<NextClientIdSlot> {
    let slot = this.normalizeDateParts(month, year);

    for (let attempts = 0; attempts < 120; attempts += 1) {
      const clientNumber = await this.getNextClientNumber(slot.month, slot.year);

      if (clientNumber <= 999) {
        return {
          year: slot.year,
          month: slot.month,
          clientNumber,
        };
      }

      slot = this.incrementMonth(slot);
    }

    throw new Error("Could not find an available client ID slot.");
  }

  async getNextAvailableId(month?: number, year?: number): Promise<string> {
    const slot = await this.getNextAvailableSlot(month, year);
    return this.generateId(slot);
  }
}

export const clientIdGenerator = new ClientIdGenerator();
