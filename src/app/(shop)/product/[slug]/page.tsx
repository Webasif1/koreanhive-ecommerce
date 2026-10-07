import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductActions } from "@/components/cart/product-actions";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductCard } from "@/components/product/product-card";
import { ReviewCard } from "@/components/review/review-card";
import { ReviewSummaryPanel } from "@/components/review/review-summary";
import { StarRating } from "@/components/product/star-rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackViewItem } from "@/components/tracking/trackers";
import { ScrollCarousel } from "@/components/ui/scroll-carousel";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatBDT, formatDeliveryWindow } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/json-ld";
import { productImage } from "@/lib/product-image";
import { absoluteUrl, withSiteSuffix } from "@/lib/site";
import { toTrackItem } from "@/lib/tracking/shared";
import {
  getDeliveryZones,
  getProductBySlug,
  getRelatedProducts,
  getSitemapEntries,
  getUnitsSold,
} from "@/server/queries/catalog";
import { getProductReviews } from "@/server/queries/reviews";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

// Prerendered and revalidated hourly. Nothing on this page reads a cookie —
// the wishlist heart and the delivery bar hydrate on the client — so it stays
// static and repeat views never touch the database.
export const revalidate = 3600;

/** At or under this many units, the page says how many are left. */
const LOW_STOCK_AT = 10;

/** Prerender every product at build time. These are the most-visited pages
 *  in the shop, and the catalogue is small enough that building all of them
 *  costs seconds while saving a database round-trip on every first view. */
export async function generateStaticParams() {
  const { products } = await getSitemapEntries();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  return {
    // The sheet's metaTitle usually ends "| Korean Hive" already, and the root
    // layout's template appends it again — every one of the 279 product pages
    // was titled "… | Korean Hive | Korean Hive", which wastes the pixels a
    // SERP snippet gives the product name. Absolute when the sheet supplies a
    // title, templated when it does not.
    title: product.metaTitle
      ? { absolute: withSiteSuffix(product.metaTitle) }
      : product.name,
    description:
      product.metaDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      // Left as "website": Next's typed Metadata API has no "product" value,
      // and the `other` escape hatch emits <meta name="…"> where Open Graph
      // needs <meta property="…">, so those tags would be ignored by every
      // parser that reads them. Shipping markup that only looks right is worse
      // than not shipping it. Google reads the Product JSON-LD below, which is
      // complete; a richer social card needs a raw <meta> in the layout head.
      type: "website",
      url: absoluteUrl(`/product/${product.slug}`),
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.images.slice(0, 3).map((image) => ({
        url: image.url,
        alt: image.alt ?? product.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [related, zones, productReviews, unitsSold] = await Promise.all([
    getRelatedProducts({
      productId: product.id,
      categoryId: product.categoryId,
      // enough for the slider below to have somewhere to go on a desktop,
      // which shows four at a time
      take: 8,
    }),
    getDeliveryZones(),
    getProductReviews(product.id),
    getUnitsSold(product.id),
  ]);

  const variantPrices = product.variants.map((v) => v.price ?? product.price);
  const priceRange =
    variantPrices.length > 0
      ? {
          low: Math.min(...variantPrices),
          high: Math.max(...variantPrices),
          count: variantPrices.length,
        }
      : null;

  const inStock = product.variants.length
    ? product.variants.some((v) => v.stock > 0)
    : product.stock > 0;

  // the real count, so the urgency badge only appears when it is true. It is
  // as fresh as the page (revalidated hourly), so it is a nudge, not a ledger.
  const totalStock = product.variants.length
    ? product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
    : product.stock;
  const lowStock = inStock && totalStock <= LOW_STOCK_AT;

  const off = discountPercent(product.price, product.comparePrice);
  const insideDhaka = zones.find((z) => z.slug === "inside-dhaka") ?? zones[0];

  // Rendered in two places: under the image on desktop, where it evens out
  // the columns so no empty block sits under the gallery, and after the buy
  // box on phones, where the columns are stacked.
  const routineCard =
    related.length > 0 ? (
      <div className="border border-border bg-white p-6">
        <p className="eyebrow">Complete the routine</p>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {related.slice(0, 2).map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              className="grid grid-cols-[54px_1fr_auto] items-center gap-3 border border-border p-2.5 hover:border-primary"
            >
              <div className="relative size-[54px] bg-blush">
                {item.images[0] && (
                  <Image
                    src={productImage(item.images[0].url)}
                    alt={item.name}
                    fill
                    sizes="54px"
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <div className="text-[12.5px] font-bold leading-snug">
                  {item.name}
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">
                  {item.brand?.name}
                </div>
              </div>
              <div className="text-[13px] font-bold">
                {formatBDT(item.variants[0]?.price ?? item.price)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    ) : null;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    ...(product.category
      ? [
          {
            name: product.category.name,
            path: `/category/${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, path: `/product/${product.slug}` },
  ];

  const trackItem = toTrackItem({
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name,
    category: product.category?.name,
    variant: product.variants[0]?.name,
    price: product.variants[0]?.price ?? product.price,
  });

  return (
    <div className="container-page py-8">
      <TrackViewItem item={trackItem} />
      <JsonLd
        data={productJsonLd({
          name: product.name,
          slug: product.slug,
          description: product.description ?? product.shortDescription,
          sku: product.sku,
          images: product.images.map((image) => image.url),
          // the same price the buy box leads with (variants[0], else base)
          price: product.variants[0]?.price ?? product.price,
          comparePrice: product.comparePrice,
          inStock,
          brandName: product.brand?.name ?? null,
          ratingAvg: product.ratingAvg,
          ratingCount: product.ratingCount,
          priceRange,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-primary">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/category/${product.category.slug}`}
                  className="hover:text-primary"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <section className="mt-4 grid gap-6 sm:mt-6 sm:gap-10 lg:grid-cols-2 lg:gap-14">
        {/* On desktop the details column runs far past the image, which left a
            tall white gap under it. Two things close it: the routine card
            moves under the image, so the columns end at about the same
            height, and the column is sticky, so any difference that remains
            is taken up by the image staying in view. A sticky box cannot
            leave its containing block, so it lets go when this section ends.
            self-start stops the grid stretching the wrapper to the row;
            top-37.5 (150px) is the 126px sticky header plus a gap. */}
        <div className="relative lg:sticky lg:top-37.5 lg:self-start">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-2">
            {off !== null && <Badge variant="sale">−{off}%</Badge>}
            {/* There was a BEST SELLER badge here on ratingCount > 50. A count
                of ratings is not a count of sales, and now that the count is
                real it would have become a false claim. The home page ranks
                best sellers from actual orders. */}
          </div>
          {routineCard && (
            <div className="mt-4 hidden lg:block">{routineCard}</div>
          )}
        </div>

        <div>
          {product.brand && (
            <Link
              href={`/brand/${product.brand.slug}`}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mulberry-hover"
            >
              {product.brand.name} · Korea →
            </Link>
          )}

          <h1 className="mt-2 font-display text-[26px] leading-tight sm:text-[30px] tracking-[-0.01em] md:text-[34px]">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
            {/* Each figure shows only once it is real: stars once a delivered
                customer has rated it, "sold" once orders back it. The dividers
                go with them, so an unrated, unsold product opens on no stray
                "|" — just the wishlist button. */}
            {product.ratingCount > 0 && (
              <a href="#reviews" className="flex items-center gap-2 hover:underline">
                <StarRating
                  value={product.ratingAvg}
                  showCount={false}
                  className="[&>span:first-child]:text-[15px]"
                />
                <span className="font-semibold">{product.ratingAvg.toFixed(1)}</span>
                <span className="text-mulberry-hover">
                  ({product.ratingCount}{" "}
                  {product.ratingCount === 1 ? "review" : "reviews"})
                </span>
              </a>
            )}
            {product.ratingCount > 0 && unitsSold > 0 && (
              <span className="text-border" aria-hidden>
                |
              </span>
            )}
            {unitsSold > 0 && (
              <span className="text-muted-foreground">
                {unitsSold.toLocaleString("en-US")} sold
              </span>
            )}
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="inline"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-hairline px-3 py-1 text-[12px] font-semibold text-muted-foreground">
                Back in stock soon
              </span>
            ) : lowStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sale/30 bg-sale-bg px-3 py-1 text-[12px] font-semibold text-sale">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-3.5">
                  <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
                </svg>
                Only {totalStock} left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-bg px-3 py-1 text-[12px] font-semibold text-success">
                In stock · ships today
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-bg px-3 py-1 text-[12px] font-semibold text-success">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-3.5">
                <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3Z" />
              </svg>
              Authenticity guaranteed
            </span>
          </div>

          <div className="mt-5">
            <ProductActions
              productId={product.id}
              productName={product.name}
              productUrl={absoluteUrl(`/product/${product.slug}`)}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                stock: v.stock,
              }))}
              basePrice={product.price}
              comparePrice={product.comparePrice}
              baseStock={product.stock}
              freeShippingThreshold={insideDhaka?.freeShippingThreshold ?? null}
              trackItem={trackItem}
            />
          </div>

          {routineCard && <div className="mt-4 lg:hidden">{routineCard}</div>}
        </div>
      </section>

      {/* ------------------------------------------------ detail sections */}
      <section className="mt-10 lg:mt-16 border border-border bg-white">
        {/* Copy only. This used to sit beside a lifestyle photo, but the asset
            was an unfilled mock-up — "drop your image here" — shown on every
            product page. max-w-3xl because without that second column the text
            would run the full container width, around 150 characters a line. */}
        <div className="max-w-3xl p-8 lg:p-12">
          <p className="eyebrow">Why you&apos;ll love it</p>
          <h2 className="mt-3.5 font-display text-2xl leading-snug md:text-[32px]">
            What it actually does
          </h2>
          {/* The summary used to sit under the title; the top of the page is
              now for buying, so it leads the description here instead. */}
          {product.shortDescription &&
            product.description &&
            product.shortDescription !== product.description && (
              <p className="mt-4 text-[15.5px] font-medium leading-relaxed text-foreground">
                {product.shortDescription}
              </p>
            )}
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
            {product.description ??
              product.shortDescription ??
              "Description coming soon."}
          </p>
        </div>
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Skin type", value: "All skin types, including sensitive" },
          { label: "Routine step", value: "After toner, before moisturiser" },
          { label: "Use", value: "Morning and night" },
          { label: "Origin", value: "Made in Korea" },
        ].map((item) => (
          <div key={item.label} className="border border-border bg-white p-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mulberry-hover">
              {item.label}
            </div>
            <div className="mt-3 text-[14.5px] font-semibold leading-relaxed">
              {item.value}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-10 lg:mt-16 lg:gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="eyebrow">How to use</p>
          <h2 className="mt-3.5 font-display text-2xl md:text-[32px]">
            Where it sits in your routine
          </h2>
          <p className="mt-3.5 whitespace-pre-line text-[14.5px] leading-relaxed text-muted-foreground">
            {product.howToUse ?? "Usage guidance coming soon."}
          </p>
          {insideDhaka && (
            <p className="mt-6 border-t border-hairline pt-4 text-[13px] text-muted-foreground">
              Delivered {insideDhaka.name.toLowerCase()} in{" "}
              {formatDeliveryWindow(insideDhaka.minDays, insideDhaka.maxDays)} ·
              cash on delivery
            </p>
          )}
        </div>
        <div>
          <p className="eyebrow">Key ingredients</p>
          <h2 className="mt-3.5 font-display text-2xl md:text-[32px]">
            What&apos;s inside
          </h2>
          <p className="mt-3.5 whitespace-pre-line text-[14.5px] leading-relaxed text-muted-foreground">
            {product.ingredients ?? "Full ingredient list coming soon."}
          </p>
        </div>
      </section>

      {/* Reviews for this product only. Absent until one is approved — an
          empty "Reviews (0)" heading on every page in a 279-product catalogue
          advertises that nobody has bought anything. The rating link at the
          top of the page jumps here. */}
      {productReviews.reviews.length > 0 && (
        <section
          id="reviews"
          className="mt-10 grid scroll-mt-37.5 gap-8 lg:mt-16 lg:grid-cols-[300px_1fr]"
        >
          <ReviewSummaryPanel
            summary={productReviews.summary}
            heading="What buyers say"
            className="h-fit border border-border bg-card p-6"
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {productReviews.reviews.slice(0, 6).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10 lg:mt-16">
          {/* One row that slides, rather than a grid that wraps onto a second
              line on a phone. Card widths match the old grid: two across on
              a phone, three on a tablet, four on a desktop. */}
          <ScrollCarousel
            label="Pairs well with this"
            itemLabel="product"
            slideClassName="basis-[calc((100%-1rem)/2)] sm:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-3rem)/4)]"
            heading={
              <>
                <p className="eyebrow">You may also like</p>
                <h2 className="mt-3 font-display text-[26px] tracking-[-0.01em] sm:text-[30px] md:text-[38px]">
                  Pairs well with this
                </h2>
              </>
            }
          >
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </ScrollCarousel>
        </section>
      )}
    </div>
  );
}
