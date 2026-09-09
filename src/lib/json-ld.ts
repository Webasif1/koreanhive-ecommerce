import { absoluteUrl, siteConfig } from "@/lib/site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    areaServed: { "@type": "Country", name: "Bangladesh" },
    sameAs: [siteConfig.social.facebook, siteConfig.social.instagram],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteConfig.name,
    url: absoluteUrl("/"),
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-BD",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export type FaqEntry = { question: string; answer: string };

export function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

type ArticleJsonLdInput = {
  slug: string;
  title: string;
  description: string;
  cover: string;
  publishedAt: string;
};

/**
 * A journal post.
 *
 * `inLanguage` is bn rather than the site's en-BD: the body is Bangla with
 * English product names in it, and telling a crawler otherwise is the kind of
 * small lie that costs a Bangla-query impression.
 */
export function articleJsonLd(post: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: absoluteUrl(post.cover),
    inLanguage: "bn",
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: { "@id": absoluteUrl("/#organization") },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

type ProductJsonLdInput = {
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  images: string[];
  price: number;
  inStock: boolean;
  brandName: string | null;
  ratingAvg: number;
  ratingCount: number;
  /** variant prices, when the product sells in several sizes */
  priceRange: { low: number; high: number; count: number } | null;
};

export function productJsonLd(product: ProductJsonLdInput) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const availability = product.inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  // several variant prices become an AggregateOffer; a single price stays a
  // plain Offer, which is what Google prefers when there is nothing to range
  const offers =
    product.priceRange && product.priceRange.count > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: siteConfig.currency,
          lowPrice: product.priceRange.low,
          highPrice: product.priceRange.high,
          offerCount: product.priceRange.count,
          availability,
          url,
        }
      : {
          "@type": "Offer",
          priceCurrency: siteConfig.currency,
          price: product.price,
          availability,
          url,
          seller: { "@id": absoluteUrl("/#organization") },
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    image: product.images.length > 0 ? product.images : undefined,
    brand: product.brandName
      ? { "@type": "Brand", name: product.brandName }
      : undefined,
    offers,
    // Only emit a rating when there is a real review behind it — an invented
    // aggregateRating is a structured-data penalty. The counts currently on
    // products come from the catalogue sheet rather than from customers, so
    // this stays off behind siteConfig.showRatings until the Review model is
    // actually in use.
    aggregateRating:
      siteConfig.showRatings && product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          }
        : undefined,
  };
}
