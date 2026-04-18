import { Prisma } from "@prisma/client";

export function isMissingCustomPriceColumn(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code !== "P2022") {
      return false;
    }

    const column = String(error.meta?.column ?? "");
    return (
      column.includes("customPrice") ||
      error.message.includes("ClientSubscription.customPrice") ||
      error.message.includes("customPrice")
    );
  }

  if (error instanceof Error) {
    return (
      error.message.includes("ClientSubscription.customPrice") ||
      error.message.includes("customPrice")
    );
  }

  return false;
}
