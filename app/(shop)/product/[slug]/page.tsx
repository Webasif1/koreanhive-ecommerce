import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, ShieldCheck, Truck } from "lucide-react";

import { ProductActions } from "@/components/cart/product-actions";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { StarRating } from "@/components/product/star-rating";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { discountPercent, formatBDT, formatDeliveryWindow } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";
import {
  getDeliveryZones,
  getProductBySlug,
  getRelatedProducts,
} from "@/server/queries/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

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

  const off = discountPercent(product.price, product.comparePrice);

  // variants may override the base price, so the structured-data range has
  // to be built from whatever each variant actually charges
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
    <div className="container-page py-8 md:py-12">
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

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-5">
          <div className="space-y-2">
            {product.brand && (
              <Link
                href={`/brand/${product.brand.slug}`}
                className="text-xs uppercase tracking-wide text-muted-foreground hover:text-primary"
              >
                {product.brand.name}
              </Link>
            )}
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {product.ratingCount > 0 && (
                <StarRating
                  value={product.ratingAvg}
                  count={product.ratingCount}
                />
              )}
              {off !== null && (
                <span className="flex items-center gap-2">
                  <Badge>-{off}%</Badge>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBDT(product.comparePrice!)}
                  </span>
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-sm text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
          </div>

          <ProductActions
            productId={product.id}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              stock: v.stock,
            }))}
            basePrice={product.price}
            baseStock={product.stock}
          />

          <ul className="grid gap-3 rounded-xl border bg-card p-4 text-sm">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              100% authentic, sourced direct from Korea
            </li>
            <li className="flex items-center gap-2.5">
              <Banknote className="size-4 shrink-0 text-success" />
              Cash on delivery — pay when it arrives
            </li>
            {zones.map((zone) => (
              <li key={zone.id} className="flex items-center gap-2.5">
                <Truck className="size-4 shrink-0 text-gold" />
                {zone.name}: {formatBDT(zone.charge)} ·{" "}
                {formatDeliveryWindow(zone.minDays, zone.maxDays)}
                {zone.freeShippingThreshold
                  ? ` · free over ${formatBDT(zone.freeShippingThreshold)}`
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="how-to-use">How to Use</TabsTrigger>
          </TabsList>
          <TabsContent value="description">
            <div className="max-w-3xl whitespace-pre-line">
              {product.description ??
                product.shortDescription ??
                "Description coming soon."}
            </div>
          </TabsContent>
          <TabsContent value="ingredients">
            <div className="max-w-3xl whitespace-pre-line">
              {product.ingredients ?? "Full ingredient list coming soon."}
            </div>
          </TabsContent>
          <TabsContent value="how-to-use">
            <div className="max-w-3xl whitespace-pre-line">
              {product.howToUse ?? "Usage guidance coming soon."}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            You may also like
          </h2>
          <div className="mt-5">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
