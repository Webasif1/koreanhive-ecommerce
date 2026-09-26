/**
 * The combo saving a cart earns.
 *
 * A combo is not a line in the cart: "Add combo to cart" puts its members in
 * as ordinary products. The saving is worked out from what the cart holds —
 * every complete set of a live combo's members comes off at the combo price.
 * That keeps the cart cookie unchanged, corrects itself when a member is
 * removed, and treats a shopper who adds the members one by one the same as
 * one who pressed the combo button.
 *
 * Pure, and shared by the cart and checkout so the two cannot price a combo
 * differently. All amounts are whole taka.
 */

export type ComboRule = {
  slug: string;
  name: string;
  price: number;
  productSlugs: string[];
};

export type PricedItem = { slug: string; unitPrice: number; quantity: number };

export type AppliedCombo = {
  slug: string;
  name: string;
  sets: number;
  /** total saving across all sets */
  saving: number;
};

/** "Glass Skin Starter", or "Glass Skin Starter × 2" for more than one set. */
export function comboNames(
  combos: { name: string; sets: number }[] | null | undefined,
) {
  return (combos ?? []).map((combo) =>
    combo.sets > 1 ? `${combo.name} × ${combo.sets}` : combo.name,
  );
}

export function applyCombos(
  items: PricedItem[],
  rules: ComboRule[],
): { comboDiscount: number; applied: AppliedCombo[] } {
  const available = new Map<string, number>();
  const unitPrice = new Map<string, number>();

  for (const item of items) {
    available.set(item.slug, (available.get(item.slug) ?? 0) + item.quantity);
    // a product in the cart at two sizes counts toward a set at its cheapest
    const current = unitPrice.get(item.slug);
    if (current === undefined || item.unitPrice < current) {
      unitPrice.set(item.slug, item.unitPrice);
    }
  }

  const candidates = rules.flatMap((rule) => {
    const members = [...new Set(rule.productSlugs)];
    if (members.length === 0) return [];
    if (!members.every((slug) => unitPrice.has(slug))) return [];

    const separately = members.reduce((sum, slug) => sum + unitPrice.get(slug)!, 0);
    const perSet = separately - rule.price;

    // a "combo" that costs as much as its parts saves nothing
    return perSet > 0 ? [{ rule, members, perSet }] : [];
  });

  // Combos share members (one sunscreen sits in several), so a unit can only
  // count once. Best saving first, so an overlap resolves in the customer's
  // favour.
  candidates.sort((a, b) => b.perSet - a.perSet);

  const applied: AppliedCombo[] = [];

  for (const { rule, members, perSet } of candidates) {
    const sets = Math.min(...members.map((slug) => available.get(slug) ?? 0));
    if (sets <= 0) continue;

    for (const slug of members) {
      available.set(slug, (available.get(slug) ?? 0) - sets);
    }

    applied.push({ slug: rule.slug, name: rule.name, sets, saving: perSet * sets });
  }

  return {
    comboDiscount: applied.reduce((sum, combo) => sum + combo.saving, 0),
    applied,
  };
}
