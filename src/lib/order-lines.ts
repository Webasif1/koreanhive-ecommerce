import { COMBO_BY_SLUG } from "@/data/combos";
import { groupCartLines, type ComboDisplay } from "@/lib/cart-groups";

/**
 * A placed order, shown the way the cart showed it: each combo set as one
 * line at its combo price, not as the products inside it.
 *
 * The order still stores every product — that is what was packed and what
 * stock came off — so this only regroups for display. It is used by the
 * confirmation page, the tracking page and the customer emails, so all three
 * describe the order the same way.
 *
 * Pure: no database, so it can run inside an email template.
 */

export type OrderComboSnapshot = {
  slug: string;
  name: string;
  sets: number;
  /** combo price per set, snapshotted at checkout; absent on older orders */
  price?: number | null;
  regularPrice?: number | null;
  productSlugs?: string[] | null;
  imageUrl?: string | null;
};

export type GroupableOrderItem = {
  productSlug: string;
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderComboLine = {
  key: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  sets: number;
  unitPrice: number;
  comparePrice: number | null;
  lineTotal: number;
};

export function groupOrderLines<T extends GroupableOrderItem>(order: {
  items: T[];
  combos?: OrderComboSnapshot[] | null;
  subtotal: number;
  comboDiscount?: number | null;
}) {
  const combos = order.combos ?? [];
  const comboDiscount = order.comboDiscount ?? 0;

  const lines = order.items.map((item, index) => ({
    ...item,
    key: String(index),
    slug: item.productSlug,
    variantId: null,
    stock: Number.POSITIVE_INFINITY,
  }));

  const displays: ComboDisplay[] = combos.flatMap((combo) => {
    const seed = COMBO_BY_SLUG.get(combo.slug);
    const productSlugs = combo.productSlugs?.length
      ? combo.productSlugs
      : (seed?.steps.map((step) => step.slug) ?? []);
    if (productSlugs.length === 0) return [];

    // Orders placed before the price was snapshotted: with one combo on the
    // order its price is exact — what its members cost less the whole saving.
    // Otherwise the seed's price is the best record there is.
    let price = combo.price ?? null;
    if (price === null && combos.length === 1) {
      const members = productSlugs.reduce(
        (sum, slug) =>
          sum +
          Math.min(
            ...lines.filter((line) => line.slug === slug).map((line) => line.unitPrice),
          ),
        0,
      );
      if (Number.isFinite(members)) price = members - comboDiscount / combo.sets;
    }
    price ??= seed?.price ?? null;
    if (price === null) return [];

    return [
      {
        slug: combo.slug,
        name: combo.name,
        price,
        regularPrice: combo.regularPrice ?? seed?.regularPrice ?? null,
        imageUrl: combo.imageUrl ?? seed?.imageUrl ?? null,
        productSlugs,
      },
    ];
  });

  const grouped = groupCartLines(
    lines,
    combos.map((combo) => ({ slug: combo.slug, name: combo.name, sets: combo.sets, saving: 0 })),
    displays,
  );

  const comboLines: OrderComboLine[] = grouped.comboLines.map((line) => ({
    key: line.key,
    slug: line.slug,
    name: line.name,
    imageUrl: line.imageUrl,
    sets: line.sets,
    unitPrice: line.unitPrice,
    comparePrice: line.comparePrice,
    lineTotal: line.lineTotal,
  }));

  // back to the caller's own item shape, with what is left of each line
  const itemLines: T[] = grouped.itemLines.map((line) => ({
    ...order.items[Number(line.key)],
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));

  const shown =
    comboLines.reduce((sum, line) => sum + line.lineTotal, 0) +
    itemLines.reduce((sum, line) => sum + line.lineTotal, 0);

  // what the combo lines do not already account for — 0 whenever every
  // combo could be regrouped, which is every order placed from now on
  const remainingComboDiscount = Math.max(
    0,
    Math.round(shown - (order.subtotal - comboDiscount)),
  );

  const regularSaving = comboLines.reduce(
    (sum, line) =>
      sum + (line.comparePrice ? (line.comparePrice - line.unitPrice) * line.sets : 0),
    0,
  );

  return {
    comboLines,
    itemLines,
    /** the subtotal to show: combo lines at their combo price, plus the rest */
    subtotal: shown,
    /** a combo saving the lines could not absorb; shown as its own row */
    remainingComboDiscount,
    /** saving against the combos' regular prices, for a "You saved" line */
    regularSaving,
  };
}
