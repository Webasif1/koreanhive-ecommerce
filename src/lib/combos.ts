import type { ComboSeed } from "@/data/combos";

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

export function planCombo(
  combo: ComboSeed,
  catalog: Map<string, CatalogEntry>,
): ComboPlan {
  const blockers: string[] = [];

  if (combo.price === null) {
    blockers.push("no price set — fill it in src/data/combos.ts");
  }

  if (combo.productSlugs.length === 0) {
    blockers.push("no products listed");
  }

  for (const slug of combo.productSlugs) {
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

  const sum = combo.productSlugs.reduce(
    (total, slug) => total + (catalog.get(slug)?.price ?? 0),
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
