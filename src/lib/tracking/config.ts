import { siteConfig } from "@/lib/site";

export const SITE_URL = siteConfig.url.replace(/\/$/, "");

export const SITE_HOST = new URL(SITE_URL).hostname;

export const CURRENCY = "BDT";

// Meta dataset (pixel) "Korean Hive" in business portfolio 4069307896666901
export const META_PIXEL_ID = process.env.META_PIXEL_ID ?? "1546290089781447";

export const META_GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION ?? "v25.0";

// First-party anonymous visitor id, sent as Meta external_id from both the
// browser pixel (GTM reads the cookie) and CAPI so the two sides match.
export const VISITOR_COOKIE = "kh_eid";
