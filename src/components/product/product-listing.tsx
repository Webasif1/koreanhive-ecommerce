import { FilterSidebar } from "@/components/product/filter-sidebar";
import {
  ListingPendingProvider,
  PendingGrid,
} from "@/components/product/listing-pending";
import { ListingToolbar } from "@/components/product/listing-toolbar";
import { Pagination } from "@/components/product/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { SidebarPromos } from "@/components/product/sidebar-promos";
import { deliveryPromise, deliveryWindowsBn } from "@/lib/delivery-promise";
import {
  getDeliveryZones,
  type CatalogListing,
  type ProductSort,
} from "@/server/queries/catalog";

/**
 * Sidebar + toolbar + grid, shared by /shop, /category, /brand and /deals.
 * Deliberately not used on the home page — that is a merchandised landing
 * page, not a browsable listing.
 */
export async function ProductListing({
  listing,
  sort,
  hideFacets = [],
  emptyMessage,
}: {
  listing: CatalogListing;
  sort: ProductSort;
  hideFacets?: ("brand" | "category")[];
  emptyMessage?: string;
}) {
  const from =
    listing.products.length === 0 ? 0 : (listing.page - 1) * listing.perPage + 1;
  const to = from === 0 ? 0 : from + listing.products.length - 1;

  // "…matches those filters" is wrong when nothing is filtered — an empty
  // brand told shoppers to adjust filters they had never set.
  const filtered = listing.total !== listing.scopeTotal;
  const empty = filtered
    ? (emptyMessage ?? "Nothing matches those filters — try clearing one.")
    : "Nothing here yet. Browse the full shop to see what is in stock.";

  // cached; same rows the header banner and /shipping resolve from
  const zones = await getDeliveryZones();
  const promo = {
    brandCount: listing.brandDirectoryCount,
    deliveryLine: deliveryPromise(zones).bn,
    deliveryWindows: deliveryWindowsBn(zones),
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
      {/* collapsed by default on mobile so the products stay above the fold */}
      <details className="group lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between border border-border bg-white px-5 py-4 text-[13px] font-bold uppercase tracking-[0.1em]">
          Filters
          <span className="text-primary transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="mt-3">
          <FilterSidebar facets={listing.facets} hide={hideFacets} />
          <SidebarPromos {...promo} />
        </div>
      </details>

      <aside className="hidden lg:block">
        <FilterSidebar facets={listing.facets} hide={hideFacets} />
        <SidebarPromos {...promo} />
      </aside>

      {/* the provider spans the grid and the pager so a page click can dim the
          cards it is replacing rather than blanking the whole route */}
      <ListingPendingProvider>
        <div className="space-y-6">
          <ListingToolbar
            from={from}
            to={to}
            total={listing.total}
            active={sort}
          />

          <PendingGrid>
            <ProductGrid
              products={listing.products}
              emptyMessage={empty}
            />
          </PendingGrid>

          <Pagination page={listing.page} totalPages={listing.totalPages} />
        </div>
      </ListingPendingProvider>
    </div>
  );
}
