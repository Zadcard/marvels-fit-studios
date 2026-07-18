export type AdminLeadSource =
  | "Admin"
  | "WhatsApp"
  | "Instagram"
  | "Call"
  | "On-ground"
  | "Other";

export function normalizeLeadSource(source: string): AdminLeadSource {
  const value = source.trim().toLowerCase();
  if (value.includes("admin")) return "Admin";
  if (value.includes("whatsapp") || value === "wa") return "WhatsApp";
  if (value.includes("instagram")) return "Instagram";
  if (value.includes("call")) return "Call";
  if (value.includes("ground") || value.includes("walk")) return "On-ground";
  return "Other";
}
