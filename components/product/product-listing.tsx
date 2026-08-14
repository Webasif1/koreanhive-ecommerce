import { FilterSidebar } from "@/components/product/filter-sidebar";
import { ListingToolbar } from "@/components/product/listing-toolbar";
import { ProductGrid } from "@/components/product/product-grid";
import { SidebarPromos } from "@/components/product/sidebar-promos";
import type { CatalogListing, ProductSort } from "@/server/queries/catalog";

/**
 * Sidebar + toolbar + grid, shared by /shop, /category, /brand and /deals.
 * Deliberately not used on the home page — that is a merchandised landing
 * page, not a browsable listing.
 */
export function ProductListing({
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
          <SidebarPromos brandCount={listing.facets.brands.length} />
        </div>
      </details>

      <aside className="hidden lg:block">
        <FilterSidebar facets={listing.facets} hide={hideFacets} />
        <SidebarPromos brandCount={listing.facets.brands.length} />
      </aside>

      <div className="space-y-6">
        <ListingToolbar
          shown={listing.products.length}
          total={listing.total}
          active={sort}
        />

        <ProductGrid
          products={listing.products}
          emptyMessage={
            emptyMessage ?? "Nothing matches those filters — try clearing one."
          }
        />
      </div>
    </div>
  );
}
