import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductActions } from "@/components/cart/product-actions";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { StarRating } from "@/components/product/star-rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatBDT, formatDeliveryWindow } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";
import {
  getDeliveryZones,
  getProductBySlug,
  getRelatedProducts,
  getSitemapEntries,
} from "@/server/queries/catalog";

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
    title: product.metaTitle ?? product.name,
    description:
      product.metaDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
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

  const [related, zones] = await Promise.all([
    getRelatedProducts({
      productId: product.id,
      categoryId: product.categoryId,
    }),
    getDeliveryZones(),
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
        <div className="relative">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-2">
            {off !== null && <Badge variant="sale">−{off}%</Badge>}
            {product.ratingCount > 50 && <Badge variant="ink">BEST SELLER</Badge>}
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
            {product.ratingCount > 0 && (
              <StarRating value={product.ratingAvg} count={product.ratingCount} />
            )}
            <span className="text-border" aria-hidden>
              |
            </span>
            <span
              className={
                inStock
                  ? "text-[13px] font-bold text-success"
                  : "text-[13px] font-bold text-muted-foreground"
              }
            >
              {inStock ? "In stock · ships today" : "Back in stock soon"}
            </span>
            <span className="relative">
              <WishlistButton
                productId={product.id}
                productName={product.name}
                className="static"
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
                          src={item.images[0].url}
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

      {/* ------------------------------------------------ detail sections */}
      <section className="mt-16 border border-border bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="p-8 lg:p-12">
            <p className="eyebrow">Why you&apos;ll love it</p>
            <h2 className="mt-3.5 font-display text-2xl leading-snug md:text-[32px]">
              What it actually does
            </h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {product.description ??
                product.shortDescription ??
                "Description coming soon."}
            </p>
          </div>
          <div className="relative min-h-[320px] bg-blush lg:min-h-[520px]">
            <Image
              src="/editorial/lifestyle.webp"
              alt={`${product.name} as part of a Korean skincare routine`}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
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

      <section className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.15fr]">
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
