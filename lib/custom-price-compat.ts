export function isMissingCustomPriceColumn(error: unknown) {
  if (error instanceof Error) {
    return (
      error.message.includes("ClientSubscription.customPrice") ||
      error.message.includes("customPrice")
    );
  }

  return false;
}
