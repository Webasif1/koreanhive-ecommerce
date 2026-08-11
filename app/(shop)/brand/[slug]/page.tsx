import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product/product-grid";
import { isProductSort, SortLinks } from "@/components/product/sort-links";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { getBrandWithProducts } from "@/server/queries/catalog";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBrandWithProducts(slug);

  if (!result) return { title: "Brand Not Found" };

  return {
    title: result.brand.metaTitle ?? result.brand.name,
    description:
      result.brand.metaDescription ?? result.brand.description ?? undefined,
    // ?sort= variants are the same listing; point them all at the base URL
    alternates: { canonical: `/brand/${result.brand.slug}` },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  const [{ slug }, { sort }] = await Promise.all([params, searchParams]);
  const activeSort = isProductSort(sort) ? sort : "newest";
  const result = await getBrandWithProducts(slug, activeSort);

  if (!result) notFound();

  const { brand, products } = result;

  return (
    <div className="container-page py-10 md:py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
          { name: brand.name, path: `/brand/${brand.slug}` },
        ])}
      />

      <header className="space-y-2">
        {brand.countryOfOrigin && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {brand.countryOfOrigin}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {brand.name}
        </h1>
        {brand.description && (
          <p className="max-w-2xl text-muted-foreground">{brand.description}</p>
        )}
      </header>

      <div className="mt-6">
        <SortLinks basePath={`/brand/${brand.slug}`} active={activeSort} />
      </div>

      <div className="mt-8">
        <ProductGrid
          products={products}
         
          emptyMessage={`No ${brand.name} products in stock right now.`}
        />
      </div>
    </div>
  );
}
