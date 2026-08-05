/** All amounts are integers, whole BDT. See server/models/index.ts. */

export type PricedLine = {
  unitPrice: number;
  quantity: number;
};

export type CouponRule = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
};

export type ZoneRule = {
  charge: number;
  freeShippingThreshold: number | null;
};

export function calcSubtotal(lines: PricedLine[]) {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

/** Returns 0 when the coupon does not apply — callers decide whether that
 *  is an error (checkout) or silence (cart preview). */
export function calcDiscount(subtotal: number, coupon: CouponRule | null) {
  if (!coupon) return 0;
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;

  const raw =
    coupon.type === "PERCENTAGE"
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value;

  const capped = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;

  // never discount below zero
  return Math.max(0, Math.min(capped, subtotal));
}

/** Free-shipping threshold is measured against the pre-discount subtotal, so
 *  a coupon can never push an order back into paying delivery. */
export function calcShipping(subtotal: number, zone: ZoneRule | null) {
  if (!zone) return 0;
  if (zone.freeShippingThreshold && subtotal >= zone.freeShippingThreshold) {
    return 0;
  }
  return zone.charge;
}

export function calcTotals({
  lines,
  zone,
  coupon,
}: {
  lines: PricedLine[];
  zone: ZoneRule | null;
  coupon: CouponRule | null;
}) {
  const subtotal = calcSubtotal(lines);
  const discount = calcDiscount(subtotal, coupon);
  const shippingCharge = calcShipping(subtotal, zone);

  return {
    subtotal,
    discount,
    shippingCharge,
    total: subtotal - discount + shippingCharge,
  };
}
