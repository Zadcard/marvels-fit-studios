export const adminLeadSources = [
  "Instagram",
  "WhatsApp",
  "Phone",
  "Messenger",
  "Walk-in",
  "Other",
] as const;

export type AdminLeadSource = (typeof adminLeadSources)[number];

export function normalizeLeadSource(source: string): AdminLeadSource {
  const value = source.trim().toLowerCase();
  if (value.includes("instagram")) return "Instagram";
  if (value.includes("whatsapp") || value === "wa") return "WhatsApp";
  if (value.includes("messenger") || value.includes("facebook")) return "Messenger";
  if (value.includes("phone") || value.includes("call")) return "Phone";
  if (value.includes("walk") || value.includes("ground")) return "Walk-in";
  return "Other";
}

