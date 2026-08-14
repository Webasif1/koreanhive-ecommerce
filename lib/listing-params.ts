import type { CatalogFilters, ProductSort } from "@/server/queries/catalog";

export type ListingSearchParams = {
  sort?: string;
  brand?: string;
  category?: string;
  sale?: string;
  stock?: string;
  combo?: string;
  rating?: string;
  min?: string;
  max?: string;
};

export function isProductSort(value: string | undefined): value is ProductSort {
  return (
    value === "newest" ||
    value === "popular" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "discount"
  );
}

const list = (value: string | undefined) =>
  value ? value.split(",").filter(Boolean) : [];

/** Parses the shared listing query string used by shop, category, brand and
 *  deals. Unknown values fall back rather than erroring, so a hand-edited or
 *  stale URL still renders a page. */
export function parseListingParams(params: ListingSearchParams) {
  const sort: ProductSort = isProductSort(params.sort) ? params.sort : "newest";

  const price = (value: string | undefined) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed)
      : undefined;
  };

  // only the two offered thresholds are honoured; anything else is ignored
  const rating = params.rating === "4.5" ? 4.5 : params.rating === "4" ? 4 : undefined;

  const filters: CatalogFilters = {
    brands: list(params.brand),
    categories: list(params.category),
    onSale: params.sale === "1",
    inStock: params.stock === "1",
    inCombo: params.combo === "1",
    minRating: rating,
    minPrice: price(params.min),
    maxPrice: price(params.max),
  };

  return { sort, filters };
}
