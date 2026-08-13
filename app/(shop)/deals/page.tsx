import type { Metadata } from "next";

import { ProductListing } from "@/components/product/product-listing";
import {
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { getCatalogListing } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Hot Deals",
  description:
    "Korean skincare and beauty currently marked down at Korean Hive, with cash on delivery across Bangladesh.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const raw = await searchParams;
  const { sort: requestedSort, filters } = parseListingParams(raw);
  // biggest saving first is the point of this page, so that is the default
  const sort = raw.sort ? requestedSort : "discount";

  const listing = await getCatalogListing({
    // being discounted is the scope here, not a toggle
    scope: { comparePrice: { $ne: null, $gt: 0 } },
    filters,
    sort,
  });

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
