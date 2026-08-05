import "server-only";

import { calcTotals, type CouponRule } from "@/lib/pricing";
import { readCartCookie, readCouponCookie } from "@/server/cart-cookie";
import { connectDb } from "@/server/db";
import { Coupon, DeliveryZone, Product } from "@/server/models";

export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
};

export type Cart = Awaited<ReturnType<typeof getCart>>;

export function lineKey(productId: string, variantId: string | null) {
  return variantId ? `${productId}:${variantId}` : productId;
}

async function resolveCoupon(
  code: string | null,
  subtotal: number,
): Promise<{ coupon: CouponRule | null; error: string | null }> {
  if (!code) return { coupon: null, error: null };

  const found = await Coupon.findOne({ code }).lean();
  const now = new Date();

  if (!found || !found.isActive) {
    return { coupon: null, error: "That coupon code is not valid." };
  }
  if (found.startsAt && found.startsAt > now) {
    return { coupon: null, error: "That coupon is not active yet." };
  }
  if (found.endsAt && found.endsAt < now) {
    return { coupon: null, error: "That coupon has expired." };
  }
  if (found.usageLimit !== null && found.usageLimit !== undefined) {
    if (found.usedCount >= found.usageLimit) {
      return { coupon: null, error: "That coupon has been fully redeemed." };
    }
  }
  if (found.minSubtotal && subtotal < found.minSubtotal) {
    return {
      coupon: null,
      error: `Spend ৳${found.minSubtotal.toLocaleString("en-US")} to use ${found.code}.`,
    };
  }

  return {
    coupon: {
      code: found.code,
      type: found.type,
      value: found.value,
      minSubtotal: found.minSubtotal ?? null,
      maxDiscount: found.maxDiscount ?? null,
    },
    error: null,
  };
}

/** Hydrates the cookie against the database. Products that were deleted or
 *  deactivated since they were added simply drop out. */
export async function getCart(zoneSlug?: string) {
  const [items, couponCode] = await Promise.all([
    readCartCookie(),
    readCouponCookie(),
  ]);

  if (items.length === 0) {
    return {
      lines: [] as CartLine[],
      itemCount: 0,
      subtotal: 0,
      discount: 0,
      shippingCharge: 0,
      total: 0,
      couponCode: null as string | null,
      couponError: null as string | null,
      zone: null,
      removedCount: 0,
    };
  }

  await connectDb();

  const [products, zone] = await Promise.all([
    Product.find({
      _id: { $in: items.map((i) => i.productId) },
      isActive: true,
    })
      .select("name slug price stock images variants")
      .lean(),
    zoneSlug
      ? DeliveryZone.findOne({ slug: zoneSlug, isActive: true }).lean()
      : Promise.resolve(null),
  ]);

  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines: CartLine[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;

    const variant = item.variantId
      ? (product.variants.find((v) => v._id.toString() === item.variantId) ??
        null)
      : null;

    // a variant that vanished invalidates the line rather than silently
    // charging the base price for a size the customer did not choose
    if (item.variantId && !variant) continue;

    const unitPrice = variant?.price ?? product.price;
    const stock = variant ? variant.stock : product.stock;
    const quantity = Math.min(item.quantity, Math.max(stock, 0));

    if (quantity <= 0) continue;

    const firstImage = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position,
    )[0];

    lines.push({
      key: lineKey(product._id.toString(), variant?._id.toString() ?? null),
      productId: product._id.toString(),
      variantId: variant?._id.toString() ?? null,
      name: product.name,
      slug: product.slug,
      variantName: variant?.name ?? null,
      imageUrl: firstImage?.url ?? null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      stock,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const { coupon, error } = await resolveCoupon(couponCode, subtotal);
  const totals = calcTotals({
    lines,
    zone: zone
      ? {
          charge: zone.charge,
          freeShippingThreshold: zone.freeShippingThreshold ?? null,
        }
      : null,
    coupon,
  });

  return {
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    ...totals,
    couponCode: coupon?.code ?? null,
    couponError: error,
    zone: zone
      ? {
          id: zone._id.toString(),
          name: zone.name,
          slug: zone.slug,
          charge: zone.charge,
          freeShippingThreshold: zone.freeShippingThreshold ?? null,
          minDays: zone.minDays,
          maxDays: zone.maxDays,
        }
      : null,
    removedCount: items.length - lines.length,
  };
}

export async function getCartItemCount() {
  const items = await readCartCookie();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
