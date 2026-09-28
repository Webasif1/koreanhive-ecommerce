import type { AppliedCombo } from "@/lib/combo-pricing";

/**
 * A combo shown as one cart line.
 *
 * Underneath, the cart still holds the combo's products one by one — that is
 * what stock is taken from, what the order records and what staff pack. This
 * only changes what the shopper sees: every complete set comes out of the
 * product lines and is shown once, at the combo price, instead of as three
 * products and a "combo saving" row they have to add up themselves.
 *
 * Pure, so the arithmetic is testable: the shown lines always sum to
 * subtotal − comboDiscount, which is what checkout charges.
 */

export type GroupableLine = {
  key: string;
  slug: string;
  variantId: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
};

export type ComboDisplay = {
  slug: string;
  name: string;
  /** the combo price, per set */
  price: number;
  /** the stated regular price, when the combo has one */
  regularPrice: number | null;
  imageUrl: string | null;
  productSlugs: string[];
};

export type ComboCartLine = {
  key: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  sets: number;
  /** per set */
  unitPrice: number;
  /** per set: the regular price, else what the members cost separately */
  comparePrice: number | null;
  lineTotal: number;
  /** most sets the members' stock allows */
  maxSets: number;
};

export function groupCartLines<T extends GroupableLine>(
  lines: T[],
  applied: AppliedCombo[],
  combos: ComboDisplay[],
): { comboLines: ComboCartLine[]; itemLines: T[] } {
  const bySlug = new Map(combos.map((combo) => [combo.slug, combo]));
  // units still unclaimed, per line
  const remaining = new Map(lines.map((line) => [line.key, line.quantity]));
  const comboLines: ComboCartLine[] = [];

  for (const set of applied) {
    const combo = bySlug.get(set.slug);
    if (!combo) continue;

    let separately = 0;
    let maxSets = Number.POSITIVE_INFINITY;

    for (const slug of new Set(combo.productSlugs)) {
      // cheapest first, the way applyCombos priced the set
      const candidates = lines
        .filter((line) => line.slug === slug)
        .sort((a, b) => a.unitPrice - b.unitPrice);

      separately += candidates[0]?.unitPrice ?? 0;
      maxSets = Math.min(maxSets, candidates[0]?.stock ?? 0);

      let needed = set.sets;
      for (const line of candidates) {
        if (needed <= 0) break;
        const free = remaining.get(line.key) ?? 0;
        const take = Math.min(free, needed);
        remaining.set(line.key, free - take);
        needed -= take;
      }
    }

    const compare = combo.regularPrice ?? separately;

    comboLines.push({
      key: `combo:${combo.slug}`,
      slug: combo.slug,
      name: combo.name,
      imageUrl: combo.imageUrl,
      sets: set.sets,
      unitPrice: combo.price,
      comparePrice: compare > combo.price ? compare : null,
      lineTotal: combo.price * set.sets,
      maxSets: Number.isFinite(maxSets) ? maxSets : set.sets,
    });
  }

  const itemLines = lines.flatMap((line) => {
    const quantity = remaining.get(line.key) ?? 0;
    if (quantity <= 0) return [];
    return [{ ...line, quantity, lineTotal: line.unitPrice * quantity }];
  });

  return { comboLines, itemLines };
}
