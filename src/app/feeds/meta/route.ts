// Meta (Facebook/Instagram) product catalogue feed → /feeds/meta
// Ids are SKUs, the same item_id the pixel and CAPI events send.

import { absoluteUrl, siteConfig } from "@/lib/site";
import { toFeedItem, toXml } from "@/lib/tracking/feed";
import { getFeedProducts } from "@/server/queries/catalog";

// Meta fetches the feed daily; rebuilding at most every 6 hours is plenty.
export const revalidate = 21600;

export async function GET() {
  const products = await getFeedProducts();
  const items = products.map((product) => toFeedItem(product, absoluteUrl));

  return new Response(toXml(items, siteConfig.url), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Feed-Items": String(items.length),
    },
  });
}
