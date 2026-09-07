import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/product/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { CONCERNS, findConcern } from "@/data/concerns";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import {
  canonicalForPage,
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { getCatalogListing } from "@/server/queries/catalog";

/**
 * Products that target a skin concern.
 *
 * The concern tiles on the home page and /concerns used to link at product
 * categories — "Acne & breakouts" went to every ampoule in the shop — because
 * nothing could filter on the `concerns[]` array the importer has been writing
 * all along. This route closes that gap using the index that already exists
 * for it (`{ isActive: 1, concerns: 1 }`).
 *
 * Six routes, all known at build time, so they prerender like the categories.
 */

type ConcernPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingSearchParams>;
};

export function generateStaticParams() {
  return CONCERNS.map((concern) => ({ slug: concern.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: ConcernPageProps): Promise<Metadata> {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const concern = findConcern(slug);

  if (!concern) return { title: "Concern Not Found" };

  const { page } = parseListingParams(rawParams);

  return {
    title: `${concern.label} — Korean Skincare`,
    description: concern.metaDescription,
    alternates: {
      canonical: canonicalForPage(`/concern/${concern.slug}`, page),
    },
  };
}

export default async function ConcernPage({
  params,
  searchParams,
}: ConcernPageProps) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const concern = findConcern(slug);

  if (!concern) notFound();

  const { sort, page, filters } = parseListingParams(rawParams);

  const listing = await getCatalogListing({
    // a product qualifies if it targets any of the tile's taxonomy values
    scope: { concerns: { $in: concern.taxonomy } },
    filters,
    sort,
    page,
  });

  if (page > listing.totalPages && page > 1) notFound();

  return (
    <div className="container-page py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Skin Concerns", path: "/concerns" },
          { name: concern.label, path: `/concern/${concern.slug}` },
        ])}
      />

      <header className="space-y-2">
        <p className="eyebrow">Shop by skin concern</p>
        <h1 className="font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          {concern.label}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {concern.detail}
        </p>
        <p className="text-sm text-muted-foreground">
          {listing.scopeTotal}{" "}
          {listing.scopeTotal === 1 ? "product" : "products"} formulated for
          this.
        </p>
      </header>

      <ProductListing
        listing={listing}
        sort={sort}
        emptyMessage={`Nothing for ${concern.label.toLowerCase()} matches those filters.`}
      />
    </div>
  );
}
