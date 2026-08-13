import type { Metadata } from "next";

import { ProductListing } from "@/components/product/product-listing";
import {
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { getCatalogListing } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Shop All Korean Skincare & Beauty",
  description:
    "Browse every Korean beauty and skincare product available at Korean Hive, with cash on delivery across Bangladesh.",
  // filter and sort combinations are the same listing; point them all at /shop
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const { sort, filters } = parseListingParams(await searchParams);
  const listing = await getCatalogListing({ filters, sort });

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
