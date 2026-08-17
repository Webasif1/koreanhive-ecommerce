import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/product/product-listing";
import {
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { buildSearchScope, getCatalogListing } from "@/server/queries/catalog";

type SearchPageProps = {
  searchParams: Promise<ListingSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();

  return {
    title: query ? `Search results for “${query}”` : "Search",
    // a result page is not content to index, whatever was typed
    robots: { index: false },
  };
}

/** Where to go when there is nothing to show — an empty page with no way out
 *  is the worst outcome of a failed search. */
function Suggestions() {
  const links = [
    { href: "/shop", label: "Browse all products" },
    { href: "/categories", label: "Shop by category" },
    { href: "/brands", label: "Shop by brand" },
    { href: "/deals", label: "See what is on offer" },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="border border-chip-border bg-blush px-4 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const { sort, page, filters } = parseListingParams(rawParams);
  const query = rawParams.q?.trim() ?? "";

  const scope = await buildSearchScope(query);

  // nothing searched for yet — a prompt, not an empty grid
  if (!scope) {
    return (
      <div className="container-page py-12">
        <p className="eyebrow">Search</p>
        <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          What are you looking for?
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Search by product, brand or concern — try “snail”, “sunscreen” or
          “Anua”.
        </p>
        <Suggestions />
      </div>
    );
  }

  const listing = await getCatalogListing({ scope, filters, sort, page });

  if (page > listing.totalPages && page > 1) notFound();

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Search</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Results for “{query}”
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {listing.total === 0
          ? "No products matched."
          : `${listing.total} ${listing.total === 1 ? "product" : "products"} matched.`}
      </p>

      {listing.total === 0 && <Suggestions />}

      <ProductListing
        listing={listing}
        sort={sort}
        emptyMessage={`Nothing matches “${query}”. Try a shorter or more general word.`}
      />
    </div>
  );
}
