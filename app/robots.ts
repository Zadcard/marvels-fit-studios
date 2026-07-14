import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated / utility surfaces should not be indexed.
        disallow: ["/admin", "/coach", "/client", "/api", "/change-password", "/auth"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
