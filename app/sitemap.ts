import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/login"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
