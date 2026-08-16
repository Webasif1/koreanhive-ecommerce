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
    title: "Hot Deals",
    description:
      "Korean skincare and beauty currently marked down at Korean Hive, with cash on delivery across Bangladesh.",
    alternates: { canonical: canonicalForPage("/deals", page) },
  };
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const raw = await searchParams;
  const { sort: requestedSort, page, filters } = parseListingParams(raw);
  // biggest saving first is the point of this page, so that is the default
  const sort = raw.sort ? requestedSort : "discount";

  const listing = await getCatalogListing({
    // being discounted is the scope here, not a toggle
    scope: { comparePrice: { $ne: null, $gt: 0 } },
    filters,
    sort,
    page,
  });

  if (page > listing.totalPages && page > 1) notFound();

  return (
    <div className="container-page py-12">
      <header>
        <p className="eyebrow">Hot deals</p>
        <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          Marked down right now
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {listing.scopeTotal}{" "}
          {listing.scopeTotal === 1 ? "product" : "products"} below their usual
          price.
        </p>
      </header>

      <ProductListing
        listing={listing}
        sort={sort}
        emptyMessage="No active discounts match those filters."
      />
    </div>
  );
}
