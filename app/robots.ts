import type { MetadataRoute } from "next";

import { absoluteUrl, NO_INDEX_PATHS } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // transactional and personal routes: nothing here belongs in an index
      disallow: [...NO_INDEX_PATHS],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
