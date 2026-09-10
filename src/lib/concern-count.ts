/**
 * How many distinct products a concern covers.
 *
 * Pure and in `lib/` rather than beside the aggregation in
 * `server/queries/catalog.ts`, because that module opens with
 * `import "server-only"` and so cannot be imported by a test at all. The
 * database round trip is untestable here; this arithmetic is exactly the part
 * that can be wrong, so it lives where it can be checked.
 *
 * The deduplication is the point. A concern maps to several taxonomy values —
 * "Acne & breakouts" covers both `acne` and `large-pores` — and a product
 * tagged with two of them must count once. Summing the per-value totals would
 * advertise more stock on the tile than the listing behind it can show.
 */
export function countConcernProducts(
  productIdsByTaxonomy: Record<string, string[]>,
  taxonomy: readonly string[],
) {
  const seen = new Set<string>();
  for (const value of taxonomy) {
    for (const id of productIdsByTaxonomy[value] ?? []) seen.add(id);
  }
  return seen.size;
}
