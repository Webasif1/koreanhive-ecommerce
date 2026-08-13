import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/product/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import {
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { getBrandScope, getCatalogListing } from "@/server/queries/catalog";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingSearchParams>;
};

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const scope = await getBrandScope(slug);

  if (!scope) return { title: "Brand Not Found" };

  return {
    title: scope.brand.metaTitle ?? scope.brand.name,
    description:
      scope.brand.metaDescription ?? scope.brand.description ?? undefined,
    // filter and sort combinations are the same listing
    alternates: { canonical: `/brand/${scope.brand.slug}` },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const { sort, filters } = parseListingParams(rawParams);

  const scope = await getBrandScope(slug);
  if (!scope) notFound();

  const { brand, brandId } = scope;

  const listing = await getCatalogListing({
    scope: { brandId },
    filters,
    sort,
  });

  return (
    <div className="container-page py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
          { name: brand.name, path: `/brand/${brand.slug}` },
        ])}
      />

      <header className="space-y-2">
        {brand.countryOfOrigin && (
          <p className="eyebrow">{brand.countryOfOrigin}</p>
        )}
        <h1 className="font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          {brand.name}
        </h1>
        {brand.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {brand.description}
          </p>
        )}
      </header>

      <ProductListing
        listing={listing}
        sort={sort}
        // the route already fixes the brand
        hideFacets={["brand"]}
        emptyMessage={`No ${brand.name} products match those filters.`}
      />
    </div>
  );
}
