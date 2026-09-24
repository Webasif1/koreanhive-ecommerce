// Safe to import from both server and client code.
import type { MetaCustomData, TrackItem } from "./types";

/**
 * Bangladesh mobile as Meta wants it: E.164 digits without "+".
 * 01840830658 → 8801840830658. Not the checkout's normalizeBdPhone
 * (src/lib/bd-districts.ts), which strips the country code instead.
 */
export function metaPhone(raw?: string | null): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = "88" + d;
  else if (d.length === 10 && d.startsWith("1")) d = "880" + d;
  return d;
}

export function itemsValue(items: TrackItem[]) {
  return (
    Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) /
    100
  );
}

/** Meta custom_data from cart/order items. */
export function metaCustomFromItems(
  items: TrackItem[],
  value?: number,
): MetaCustomData {
  return {
    currency: "BDT",
    value: Math.round((value ?? itemsValue(items)) * 100) / 100,
    content_type: "product",
    content_ids: items.map((i) => String(i.item_id)),
    contents: items.map((i) => ({
      id: String(i.item_id),
      quantity: i.quantity,
      item_price: i.price,
    })),
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    ...(items.length === 1
      ? {
          content_name: items[0].item_name,
          content_category: items[0].item_category,
        }
      : {}),
  };
}

/** Cart lines (cart and checkout pages) as tracking items. */
export function cartTrackItems(
  lines: {
    sku: string | null;
    slug: string;
    name: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
  }[],
): TrackItem[] {
  return lines.map((line) =>
    toTrackItem(
      {
        sku: line.sku,
        slug: line.slug,
        name: line.name,
        variant: line.variantName,
        price: line.unitPrice,
      },
      line.quantity,
    ),
  );
}

export function toTrackItem(
  p: {
    sku: string | null | undefined;
    /** Stands in for a missing SKU so the event still fires. */
    slug?: string | null;
    name: string;
    brand?: string | null;
    category?: string | null;
    variant?: string | null;
    price: number;
  },
  quantity = 1,
): TrackItem {
  return {
    item_id: p.sku || p.slug || p.name,
    item_name: p.name,
    item_brand: p.brand ?? undefined,
    item_category: p.category ?? undefined,
    item_variant: p.variant ?? undefined,
    price: Number(p.price),
    quantity,
  };
}
