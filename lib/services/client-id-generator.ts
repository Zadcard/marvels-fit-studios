import { getPrisma } from "@/lib/prisma";

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

export class ClientIdGenerator {
  private get prisma() {
    return getPrisma();
  }

  generateId(options?: ClientIdGeneratorOptions): string {
    const now = new Date();
    const year = (options?.year || now.getFullYear()).toString().slice(-2);
    const month = String(options?.month || now.getMonth() + 1).padStart(2, "0");
    const clientNum = String(options?.clientNumber || 1).padStart(3, "0");

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
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const yearStr = targetYear.toString().slice(-2);
    const monthStr = String(targetMonth).padStart(2, "0");
    const prefix = `${yearStr}${monthStr}`;

    const latestClient = await this.prisma.user.findFirst({
      where: {
        clientId: {
          startsWith: prefix,
        },
      },
      orderBy: { clientId: "desc" },
      select: { clientId: true },
    });

    if (!latestClient?.clientId) {
      return 1;
    }

    const currentNumber = parseInt(latestClient.clientId.slice(4, 7), 10);
    return currentNumber + 1;
  }
}

export const clientIdGenerator = new ClientIdGenerator();
