import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

// Baseline hardening headers for every response. A full Content-Security-Policy
// is intentionally omitted: Next.js inline runtime scripts require nonce
// plumbing to allow, and a broken CSP silently disables the app.
const securityHeaders = [
  // Never let browsers guess content types (blocks MIME-confusion XSS).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The app has no legitimate embedding use case; block clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Don't leak dashboard URLs (which encode business activity) cross-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app uses none of these sensors.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Production is HTTPS-only (Netlify); pin it for two years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
