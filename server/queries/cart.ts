import "server-only";

import { calcTotals, type CouponRule } from "@/lib/pricing";
import { readCartCookie, readCouponCookie } from "@/server/cart-cookie";
import { db } from "@/server/db";

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

  const found = await db.coupon.findUnique({ where: { code } });
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
  if (found.usageLimit !== null && found.usedCount >= found.usageLimit) {
    return { coupon: null, error: "That coupon has been fully redeemed." };
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
      minSubtotal: found.minSubtotal,
      maxDiscount: found.maxDiscount,
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

  const [products, zone] = await Promise.all([
    db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
        variants: {
          select: { id: true, name: true, price: true, stock: true },
        },
      },
    }),
    zoneSlug
      ? db.deliveryZone.findFirst({ where: { slug: zoneSlug, isActive: true } })
      : Promise.resolve(null),
  ]);

  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: CartLine[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;

    const variant = item.variantId
      ? (product.variants.find((v) => v.id === item.variantId) ?? null)
      : null;

    // a variant that vanished invalidates the line rather than silently
    // charging the base price for a size the customer did not choose
    if (item.variantId && !variant) continue;

    const unitPrice = variant?.price ?? product.price;
    const stock = variant ? variant.stock : product.stock;
    const quantity = Math.min(item.quantity, Math.max(stock, 0));

    if (quantity <= 0) continue;

    lines.push({
      key: lineKey(product.id, variant?.id ?? null),
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      slug: product.slug,
      variantName: variant?.name ?? null,
      imageUrl: product.images[0]?.url ?? null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      stock,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const { coupon, error } = await resolveCoupon(couponCode, subtotal);
  const totals = calcTotals({ lines, zone, coupon });

  return {
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    ...totals,
    couponCode: coupon?.code ?? null,
    couponError: error,
    zone,
    removedCount: items.length - lines.length,
  };
}

export async function getCartItemCount() {
  const items = await readCartCookie();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
