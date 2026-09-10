/**
 * The listing sidebar's numbers, as one aggregation pipeline.
 *
 * Pure and outside the query layer on purpose. This pipeline replaced ten
 * separate round trips to Atlas with a single $facet, which is the difference
 * between a category page that takes seconds and one that does not — and the
 * way it fails is quiet. Get a sub-pipeline's filter wrong and every number in
 * the sidebar is still a number, just the wrong one. Built here, it can be
 * executed against fixtures without a database.
 */

/** A product is "on sale" only when comparePrice is really above price. */
export function saleScope() {
  return {
    comparePrice: { $ne: null, $gt: 0 },
    $expr: { $gt: ["$comparePrice", "$price"] },
  };
}

/** The filter contributed by each toggleable dimension. */
export type ListingClauses = {
  brand: object;
  category: object;
  onSale: object;
  inStock: object;
  inCombo: object;
  rating: object;
  price: object;
};

export type ListingDimension = keyof ListingClauses;

/**
 * Every clause except the named one.
 *
 * This is what stops a facet zeroing itself: the count beside "Anua" has to be
 * computed with every filter applied *except* the brand one, or ticking Anua
 * would leave every other brand reading 0 and the sidebar would look broken
 * the moment anyone used it.
 *
 * `base` is deliberately excluded — the pipeline applies it once, up front.
 */
export function clausesWithout(
  clauses: ListingClauses,
  skip: ListingDimension | null,
): Record<string, unknown> {
  return Object.entries(clauses).reduce<Record<string, unknown>>(
    (acc, [key, clause]) => (key === skip ? acc : { ...acc, ...clause }),
    {},
  );
}

const count = (match: Record<string, unknown>) => [
  { $match: match },
  { $count: "n" },
];

/**
 * Build the pipeline.
 *
 * `base` is applied once as the first stage — the indexed part, the category
 * or brand whose page this is — and every sub-pipeline then filters that
 * result. Repeating base inside each facet would be dead weight, and the
 * numbers would be identical.
 */
export function buildListingFacetPipeline({
  base,
  clauses,
  comboSlugs,
}: {
  base: Record<string, unknown>;
  clauses: ListingClauses;
  comboSlugs: string[];
}) {
  const without = (skip: ListingDimension | null) =>
    clausesWithout(clauses, skip);

  return [
    { $match: base },
    {
      $facet: {
        total: count(without(null)),
        scopeTotal: [{ $count: "n" }],
        brands: [
          { $match: without("brand") },
          { $group: { _id: "$brandId", count: { $sum: 1 } } },
        ],
        categories: [
          { $match: without("category") },
          { $group: { _id: "$categoryId", count: { $sum: 1 } } },
        ],
        onSale: count({ ...without("onSale"), ...saleScope() }),
        inStock: count({ ...without("inStock"), stock: { $gt: 0 } }),
        inCombo: count({
          ...without("inCombo"),
          slug: { $in: comboSlugs },
        }),
        rating45: count({ ...without("rating"), ratingAvg: { $gte: 4.5 } }),
        rating40: count({ ...without("rating"), ratingAvg: { $gte: 4.0 } }),
        // bounds ignore the current price selection, so dragging the slider
        // cannot shrink the track out from under the handles
        priceRange: [
          { $match: without("price") },
          {
            $group: {
              _id: null,
              min: { $min: "$price" },
              max: { $max: "$price" },
            },
          },
        ],
      },
    },
  ];
}

export type ListingFacetRows = {
  total: { n: number }[];
  scopeTotal: { n: number }[];
  brands: { _id: unknown; count: number }[];
  categories: { _id: unknown; count: number }[];
  onSale: { n: number }[];
  inStock: { n: number }[];
  inCombo: { n: number }[];
  rating45: { n: number }[];
  rating40: { n: number }[];
  priceRange: { min: number; max: number }[];
};

/**
 * $facet always returns exactly one document, and $count inside it returns an
 * empty array rather than a zero. That is the trap in this shape: read it
 * carelessly and a facet with no matches renders as undefined.
 */
export function readFacetCount(rows: { n: number }[] | undefined) {
  return rows?.[0]?.n ?? 0;
}
