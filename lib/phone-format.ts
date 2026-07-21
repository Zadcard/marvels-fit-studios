const EGYPT_COUNTRY_CODE = "20";

function groupInternationalDigits(digits: string): string {
  const groups: string[] = [];
  let cursor = digits.length;

  if (cursor > 4) {
    groups.unshift(digits.slice(cursor - 4));
    cursor -= 4;
  }

  while (cursor > 3) {
    groups.unshift(digits.slice(cursor - 3, cursor));
    cursor -= 3;
  }

  if (cursor > 0) groups.unshift(digits.slice(0, cursor));
  return groups.join(" ");
}

/**
 * Formats visible phone numbers without changing the value stored in the database.
 * Egyptian mobile numbers use the studio-wide +20 100 000 0000 pattern.
 */
export function formatPhoneNumber(
  value: string | null | undefined,
  fallback = "—",
): string {
  const raw = value?.trim();
  if (!raw) return fallback;

  // Preserve explanatory copy such as "No phone" or "Not available".
  if (/[a-z]/i.test(raw)) return raw;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return fallback;
  if (digits.startsWith("00")) digits = digits.slice(2);

  let egyptianMobile = digits;
  if (egyptianMobile.startsWith(EGYPT_COUNTRY_CODE) && egyptianMobile.length === 12) {
    egyptianMobile = egyptianMobile.slice(EGYPT_COUNTRY_CODE.length);
  } else if (egyptianMobile.startsWith("0") && egyptianMobile.length === 11) {
    egyptianMobile = egyptianMobile.slice(1);
  }

  if (/^1[0125]\d{8}$/.test(egyptianMobile)) {
    return `+20 ${egyptianMobile.slice(0, 3)} ${egyptianMobile.slice(3, 6)} ${egyptianMobile.slice(6)}`;
  }

  return `+${groupInternationalDigits(digits)}`;
}
