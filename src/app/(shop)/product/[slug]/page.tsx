import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductActions } from "@/components/cart/product-actions";
import { ProductGallery } from "@/components/product/product-gallery";
import {
  DescriptionBlocks,
  ProductDetailsAccordion,
  type DetailPanel,
} from "@/components/product/product-details-accordion";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductTabs, type ProductTab } from "@/components/product/product-tabs";
import { ReviewCard } from "@/components/review/review-card";
import { ReviewSummaryPanel } from "@/components/review/review-summary";
import { StarRating } from "@/components/product/star-rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatBDT, formatDeliveryWindow } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/json-ld";
import { parseDescription, takeSection } from "@/lib/product-description";
import { productImage } from "@/lib/product-image";
import { CONCERN_LABELS, type Concern } from "@/data/chatbot/taxonomy";
import { absoluteUrl, withSiteSuffix } from "@/lib/site";
import {
  getDeliveryZones,
  getProductBySlug,
  getRelatedProducts,
  getSitemapEntries,
} from "@/server/queries/catalog";
import { getProductReviews } from "@/server/queries/reviews";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

// Prerendered and revalidated hourly. Nothing on this page reads a cookie —
// the wishlist heart and the delivery bar hydrate on the client — so it stays
// static and repeat views never touch the database.
export const revalidate = 3600;

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

  const [related, zones, productReviews] = await Promise.all([
    getRelatedProducts({
      productId: product.id,
      categoryId: product.categoryId,
    }),
    getDeliveryZones(),
    getProductReviews(product.id),
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

  const off = discountPercent(product.price, product.comparePrice);
  const insideDhaka = zones.find((z) => z.slug === "inside-dhaka") ?? zones[0];

  // The description's own headings become the Description tab's cards. The known
  // sections are taken out in the order a shopper asks about them; anything
  // left over still gets a card, so no copy from the sheet is dropped.
  const details = parseDescription(product.description);
  const rest = [...details.sections];
  const benefits = takeSection(rest, /^key benefits/i);
  const whoFor = takeSection(rest, /^who it/i);
  const keyIngredients = takeSection(rest, /^key ingredients/i);
  const howTo = takeSection(rest, /^how to use/i);
  const whyUs = takeSection(rest, /^why buy/i);
  const faq = takeSection(rest, /^frequently asked/i);
  const concernLabels = product.concerns.map(
    (concern) => CONCERN_LABELS[concern as Concern] ?? concern,
  );

  const descriptionCards: { title: string; content: ReactNode }[] = [];

  if (benefits) {
    descriptionCards.push({
      title: "Key benefits",
      content: <DescriptionBlocks blocks={benefits.blocks} />,
    });
  }

  if (whoFor || concernLabels.length > 0) {
    descriptionCards.push({
      title: "Skin type & who it's for",
      content: (
        <>
          {whoFor && <DescriptionBlocks blocks={whoFor.blocks} />}
          {concernLabels.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground">
                Targets
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {concernLabels.map((label) => (
                  <li
                    key={label}
                    className="border border-chip-border bg-blush px-3 py-1 text-[12.5px] font-semibold text-primary"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ),
    });
  }

  if (keyIngredients || product.ingredients) {
    descriptionCards.push({
      title: "Key ingredients",
      content: keyIngredients ? (
        <DescriptionBlocks blocks={keyIngredients.blocks} />
      ) : (
        <p className="whitespace-pre-line">{product.ingredients}</p>
      ),
    });
  }

  if (howTo || product.howToUse) {
    descriptionCards.push({
      title: "How to use",
      content: (
        <>
          {howTo && <DescriptionBlocks blocks={howTo.blocks} />}
          {product.howToUse && (
            <div className="border-l-2 border-primary pl-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground">
                Our tips
              </p>
              <p className="mt-1 whitespace-pre-line">{product.howToUse}</p>
            </div>
          )}
        </>
      ),
    });
  }

  if (whyUs || insideDhaka) {
    descriptionCards.push({
      title: "Why buy from Korean Hive",
      content: (
        <>
          {whyUs && <DescriptionBlocks blocks={whyUs.blocks} />}
          {insideDhaka && (
            <p className="text-[13px]">
              Delivered {insideDhaka.name.toLowerCase()} in{" "}
              {formatDeliveryWindow(insideDhaka.minDays, insideDhaka.maxDays)} ·
              cash on delivery
            </p>
          )}
        </>
      ),
    });
  }

  for (const section of rest) {
    descriptionCards.push({
      title: section.title,
      content: <DescriptionBlocks blocks={section.blocks} />,
    });
  }

  // Each FAQ question is its own collapsible row inside the FAQ tab.
  const faqPanels: DetailPanel[] = (faq?.blocks ?? []).flatMap((block, index) =>
    block.kind === "qa"
      ? [
          {
            title: block.question,
            defaultOpen: index === 0,
            content: (
              <DescriptionBlocks
                blocks={[{ kind: "paragraph", text: block.answer }]}
              />
            ),
          },
        ]
      : [],
  );

  const reviewCount = productReviews.summary.count;

  const tabs: ProductTab[] = [
    {
      value: "description",
      label: "Description",
      content: (
        <div>
          <p className="eyebrow">Why you&apos;ll love it</p>
          <h2 className="mt-3 font-display text-2xl leading-snug md:text-[32px]">
            What it actually does
          </h2>
          <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-muted-foreground">
            {details.intro.length > 0 ? (
              <DescriptionBlocks blocks={details.intro} />
            ) : (
              <p>{product.shortDescription ?? "Description coming soon."}</p>
            )}
          </div>

          {descriptionCards.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {descriptionCards.map((card) => (
                <div
                  key={card.title}
                  className="border border-border bg-cream/60 p-5 sm:p-6"
                >
                  <h3 className="eyebrow">{card.title}</h3>
                  <div className="mt-3 space-y-3 text-[14px] leading-[1.8] text-muted-foreground">
                    {card.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (faqPanels.length > 0) {
    tabs.push({
      value: "faq",
      label: "FAQ",
      content: (
        <div className="max-w-3xl">
          <ProductDetailsAccordion panels={faqPanels} />
        </div>
      ),
    });
  }

  // Hidden until a product has an approved review: "Reviews (0)" on every
  // page in the catalogue would advertise that nobody has bought anything.
  if (reviewCount > 0) {
    tabs.push({
      value: "reviews",
      label: `Reviews (${reviewCount})`,
      content: (
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
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
        </div>
      ),
    });
  }

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

  return (
    <div className="container-page py-8">
      <JsonLd
        data={productJsonLd({
          name: product.name,
          slug: product.slug,
          description: product.description ?? product.shortDescription,
          sku: product.sku,
          images: product.images.map((image) => image.url),
          price: product.price,
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

      <section className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* On desktop the details column runs far past the image, which left a
            tall white gap under it. Sticky keeps the image in view while the
            details scroll, and because a sticky box cannot leave its
            containing block it lets go when this section ends. self-start
            stops the grid stretching the wrapper to the row, which would leave
            it no room to move; top-37.5 (150px) is the 126px sticky header plus
            a gap. */}
        <div className="relative lg:sticky lg:top-37.5 lg:self-start">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-2">
            {off !== null && <Badge variant="sale">−{off}%</Badge>}
            {/* There was a BEST SELLER badge here on ratingCount > 50. A count
                of ratings is not a count of sales, and now that the count is
                real it would have become a false claim. The home page ranks
                best sellers from actual orders. */}
          </div>
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

          <h1 className="mt-3 font-display text-[30px] leading-tight tracking-[-0.01em] md:text-[38px]">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="mt-3.5 max-w-[520px] text-[15.5px] leading-relaxed text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* stars only once a delivered customer has rated it — and the
                divider with them, or an unrated product opens on a stray "|" */}
            {product.ratingCount > 0 && (
              <>
                <StarRating value={product.ratingAvg} count={product.ratingCount} />
                <span className="text-border" aria-hidden>
                  |
                </span>
              </>
            )}
            <span
              className={
                inStock
                  ? "text-[13px] font-bold text-success"
                  : "text-[13px] font-bold text-muted-foreground"
              }
            >
              {inStock ? "In stock · ships today" : "Back in stock soon"}
            </span>
            <span className="ml-auto">
              <WishlistButton
                productId={product.id}
                productName={product.name}
                variant="inline"
              />
            </span>
          </div>

          <div className="mt-5">
            <ProductActions
              productId={product.id}
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
            />
          </div>

      {related.length > 0 && (
            <div className="mt-4 border border-border bg-white p-6">
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
          )}
        </div>
      </section>

      {/* ------------------------------------------------ detail sections
          Description / FAQ / Reviews tabs. The description used to print as
          raw markdown, asterisks and all, and four hardcoded tiles told every
          product — cleansers and sunscreens included — that it suited all skin
          types and went after toner. Each tab now holds that product's own
          content, parsed from its description's headings. */}
      <section className="mt-16 border border-border bg-white p-4 sm:p-6 lg:p-8">
        <ProductTabs tabs={tabs} />
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">You may also like</p>
          <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
            Pairs well with this
          </h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
