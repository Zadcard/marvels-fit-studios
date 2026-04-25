export function normalizeWhatsAppPhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return null;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `20${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("1")) {
    return `20${digits}`;
  }

  return digits;
}

export function buildWhatsAppHref(phone: string | null | undefined) {
  const normalized = normalizeWhatsAppPhone(phone);
  return normalized ? `https://wa.me/${normalized}` : null;
}
