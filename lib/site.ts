/**
 * Canonical site-level constants for metadata, sitemap, robots, manifest,
 * and structured data. Keep marketing/SEO facts here so they stay consistent.
 */
export const siteUrl = (
  process.env.APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Marvel's Fit Studios",
  shortName: "Marvel Fit",
  description:
    "Premium performance training studio in Giza, Egypt — group training, private coaching, expert trainers, and a structured membership experience.",
  locality: "Giza",
  region: "Giza",
  country: "EG",
  logoPath: "/img/Logo-1.png",
} as const;

export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
