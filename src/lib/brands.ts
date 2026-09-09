/** The shape `getBrands()` returns, narrowed to what the ranking needs. */
export type BrandStock = { name: string; _count: { products: number } };

/**
 * The best-stocked brands, most products first.
 *
 * The home page shows ten of the 71 and links to /brands for the rest. Ranking
 * by how much of a brand we actually stock needs no editorial claim about which
 * names are "famous", re-ranks itself as the catalogue changes, and keeps every
 * tile pointing at a brand page with real depth rather than one product.
 *
 * The name tiebreak is deliberate. `getBrands()` returns name-ascending and
 * V8's sort is stable, so sorting on count alone would look right today —
 * Beauty of Joseon and Some By Mi are both on 8 and only the name decides which
 * one makes the cut. Relying on that stability is the same shape of bug as the
 * pagination `_id` tiebreaker: correct until the input order changes underneath
 * it, and silently wrong after.
 *
 * Sorts a copy, so the caller's list keeps its own order — the home page still
 * needs the full one for its counts.
 */
export function topBrandsByStock<T extends BrandStock>(
  brands: T[],
  limit: number,
): T[] {
  return [...brands]
    .sort(
      (a, b) =>
        b._count.products - a._count.products || a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}
