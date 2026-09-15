import { comboProductSlugs, type ComboSeed } from "@/data/combos";

/**
 * Deciding whether a bundle may go live.
 *
 * Pure, and separate from the script that writes: the rule "never publish a
 * combo a shopper cannot buy from" is the valuable part, so it is testable
 * without a database. The script does the talking to Mongo.
 */

export type CatalogEntry = {
  name: string;
  price: number;
  isActive: boolean;
};

export type ComboPlan =
  | { status: "publish"; combo: ComboSeed; price: number; comparePrice: number | null }
  | { status: "blocked"; combo: ComboSeed; blockers: string[] };

export type ShelfEntry<T extends { slug: string }> =
  | { status: "live"; combo: T; seed: ComboSeed | undefined }
  | { status: "soon"; seed: ComboSeed };

/**
 * Every combo the /combos page shows, buyable ones first.
 *
 * The page used to render only what combos:sync had published, so a combo
 * whose products were not stocked yet vanished — the client supplied ten and
 * saw four. Now each seed appears either way: live if its combo is published,
 * otherwise "soon", shown with no way to buy it.
 *
 * Live first, so the top of the page is what a shopper can actually order.
 * Both groups follow the seed's `position`. A published combo with no seed
 * (removed from the data but still in the database) stays in the live group
 * rather than silently disappearing.
 */
export function comboShelf<T extends { slug: string }>(
  seeds: ComboSeed[],
  live: T[],
): ShelfEntry<T>[] {
  const bySlug = new Map(live.map((combo) => [combo.slug, combo]));
  const ordered = [...seeds].sort((a, b) => a.position - b.position);
  const seeded = new Set(seeds.map((seed) => seed.slug));

  const liveEntries: ShelfEntry<T>[] = ordered.flatMap((seed) => {
    const combo = bySlug.get(seed.slug);
    return combo ? [{ status: "live" as const, combo, seed }] : [];
  });

  const unseeded: ShelfEntry<T>[] = live
    .filter((combo) => !seeded.has(combo.slug))
    .map((combo) => ({ status: "live" as const, combo, seed: undefined }));

  const soon: ShelfEntry<T>[] = ordered
    .filter((seed) => !bySlug.has(seed.slug))
    .map((seed) => ({ status: "soon" as const, seed }));

  return [...liveEntries, ...unseeded, ...soon];
}

export function planCombo(
  combo: ComboSeed,
  catalog: Map<string, CatalogEntry>,
): ComboPlan {
  const blockers: string[] = [];

  if (combo.price === null) {
    blockers.push("no price set — fill it in src/data/combos.ts");
  }

  const slugs = comboProductSlugs(combo);

  if (slugs.length === 0) {
    blockers.push("no products listed");
  }

  for (const slug of slugs) {
    const product = catalog.get(slug);

    if (!product) {
      blockers.push(`missing from the catalogue: ${slug}`);
    } else if (!product.isActive) {
      // a draft is unpublished because it has no image; linking to one sends
      // the shopper to a page that will not resolve
      blockers.push(`unpublished (needs an image): ${slug}`);
    }
  }

  if (blockers.length > 0) return { status: "blocked", combo, blockers };

  const sum = slugs.reduce(
    (total: number, slug: string) => total + (catalog.get(slug)?.price ?? 0),
    0,
  );

  const price = combo.price as number;

  return {
    status: "publish",
    combo,
    price,
    // only a saving when the bundle genuinely costs less than its parts; a
    // "was" price that is not higher is a fake discount
    comparePrice: sum > price ? sum : null,
  };
}
