// Meta (Facebook/Instagram) catalogue feed, RSS 2.0 with the g: namespace.
// Pure: product rows in, XML out, so it can be tested without a database.

export const GOOGLE_CATEGORY = "Health & Beauty > Personal Care > Cosmetics"; // taxonomy id 2915

export type FeedProduct = {
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  comparePrice: number | null;
  inStock: boolean;
  images: string[];
  brand: string | null;
  categoryPath: string[];
};

export type FeedItem = {
  id: string;
  title: string;
  description: string;
  availability: "in stock" | "out of stock";
  price: number;
  salePrice: number | null;
  link: string;
  image: string;
  additionalImages: string[];
  brand: string;
  productType: string;
};

export const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** Meta ads are safest with JPG/PNG; ask ImageKit for a 1080px JPG of the
 *  .webp originals. Leaves a URL that already carries a transform alone. */
export const feedImage = (url: string) =>
  url.includes("ik.imagekit.io") && !/[?&]tr=/.test(url)
    ? `${url}${url.includes("?") ? "&" : "?"}tr=f-jpg,w-1080`
    : url;

const stripMarkdown = (s: string) =>
  s
    .replace(/\*+|__|`/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

export function toFeedItem(
  p: FeedProduct,
  link: (path: string) => string,
): FeedItem {
  const title = p.name.slice(0, 150);

  let description = stripMarkdown(p.description || p.shortDescription || title);
  if (description.length > 4900) {
    description = description.slice(0, 4900).replace(/\s\S*$/, "") + "…";
  }

  // g:price is the regular price; the selling price goes in g:sale_price only
  // when it is genuinely lower, or Meta shows a discount that is not there
  const onSale = p.comparePrice !== null && p.comparePrice > p.price;

  return {
    id: p.sku,
    title,
    description,
    availability: p.inStock ? "in stock" : "out of stock",
    price: onSale ? (p.comparePrice as number) : p.price,
    salePrice: onSale ? p.price : null,
    link: link(`/product/${p.slug}`),
    image: p.images[0] ? feedImage(p.images[0]) : "",
    additionalImages: p.images.slice(1, 10).map(feedImage),
    brand: p.brand || "Korean Hive",
    productType: p.categoryPath.join(" > "),
  };
}

export function toXml(items: FeedItem[], origin: string) {
  const rows = items
    .map((p) =>
      [
        "  <item>",
        `    <g:id>${esc(p.id)}</g:id>`,
        `    <g:title>${esc(p.title)}</g:title>`,
        `    <g:description>${esc(p.description)}</g:description>`,
        `    <g:availability>${p.availability}</g:availability>`,
        "    <g:condition>new</g:condition>",
        `    <g:price>${p.price.toFixed(2)} BDT</g:price>`,
        p.salePrice !== null
          ? `    <g:sale_price>${p.salePrice.toFixed(2)} BDT</g:sale_price>`
          : "",
        `    <g:link>${esc(p.link)}</g:link>`,
        `    <g:image_link>${esc(p.image)}</g:image_link>`,
        ...p.additionalImages.map(
          (img) => `    <g:additional_image_link>${esc(img)}</g:additional_image_link>`,
        ),
        `    <g:brand>${esc(p.brand)}</g:brand>`,
        `    <g:google_product_category>${esc(GOOGLE_CATEGORY)}</g:google_product_category>`,
        p.productType ? `    <g:product_type>${esc(p.productType)}</g:product_type>` : "",
        "  </item>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Korean Hive</title>
  <link>${esc(origin)}</link>
  <description>Korean Hive product catalogue</description>
${rows}
</channel>
</rss>`;
}
