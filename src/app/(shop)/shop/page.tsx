import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/product/product-listing";
import {
  canonicalForPage,
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { getCatalogListing } from "@/server/queries/catalog";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}): Promise<Metadata> {
  const { page } = parseListingParams(await searchParams);

  return {
    title: "Shop All Korean Skincare & Beauty",
    description:
      "Browse every Korean beauty and skincare product available at Korean Hive, with cash on delivery across Bangladesh.",
    // filter and sort combinations are the same listing, so they collapse to
    // /shop — but each page is distinct content and canonicalises to itself
    alternates: { canonical: canonicalForPage("/shop", page) },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const { sort, page, filters } = parseListingParams(await searchParams);
  const listing = await getCatalogListing({ filters, sort, page });

  // an empty page past the end is a soft 404 to a crawler
  if (page > listing.totalPages && page > 1) notFound();

  return (
    <div className="container-page py-12">
      <header>
        <p className="eyebrow">All products</p>
        <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          Shop
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {listing.scopeTotal} authentic K-beauty products, delivered
          nationwide.
        </p>
      </header>

      <ProductListing listing={listing} sort={sort} />
    </div>
  );
}
