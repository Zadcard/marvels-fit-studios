import type { DashboardRole } from "@/lib/auth/authorization-policy";

export function getSafeNotificationHref(
  href: string | null,
  role: DashboardRole,
) {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;

  const [pathname] = href.split(/[?#]/, 1);
  const roleRoot = role === "admin" ? "/admin" : "/coach";
  if (pathname !== roleRoot && !pathname.startsWith(`${roleRoot}/`)) return null;

  return href;
}
