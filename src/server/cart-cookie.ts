import "server-only";

import { cookies } from "next/headers";

export const CART_COOKIE = "kh_cart";
export const COUPON_COOKIE = "kh_coupon";
export const LAST_ORDER_COOKIE = "kh_last_order";

const MAX_QUANTITY_PER_LINE = 20;

export type CartCookieItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

/** The cookie stores identifiers and quantities only — never prices. Every
 *  amount shown or charged is recomputed from the database, so a tampered
 *  cookie can change what is in the cart but never what it costs. */
export function parseCart(raw: string | undefined): CartCookieItem[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): CartCookieItem[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { productId, variantId, quantity } = entry as Record<
        string,
        unknown
      >;

      if (typeof productId !== "string" || productId.length === 0) return [];
      if (typeof quantity !== "number" || !Number.isFinite(quantity)) return [];

      const clamped = Math.min(
        MAX_QUANTITY_PER_LINE,
        Math.max(1, Math.floor(quantity)),
      );

      return [
        {
          productId,
          variantId: typeof variantId === "string" ? variantId : null,
          quantity: clamped,
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function readCartCookie(): Promise<CartCookieItem[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

export async function writeCartCookie(items: CartCookieItem[]) {
  const store = await cookies();

  if (items.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }

  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readCouponCookie() {
  const store = await cookies();
  return store.get(COUPON_COOKIE)?.value ?? null;
}

export async function writeCouponCookie(code: string | null) {
  const store = await cookies();

  if (!code) {
    store.delete(COUPON_COOKIE);
    return;
  }

  store.set(COUPON_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Lets the success page prove the visitor just placed this order, without
 *  exposing anyone else's order to a guessed URL. */
export async function grantOrderAccess(orderNumber: string) {
  const store = await cookies();
  store.set(LAST_ORDER_COOKIE, orderNumber, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function hasOrderAccess(orderNumber: string) {
  const store = await cookies();
  return store.get(LAST_ORDER_COOKIE)?.value === orderNumber;
}

export { MAX_QUANTITY_PER_LINE };
