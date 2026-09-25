/**
 * One shared read of /api/cart/count for every client component that needs it.
 *
 * The header badge and the product page's free-delivery bar each fetched the
 * endpoint on mount, and the badge again on every navigation — so a product
 * page view cost two identical, uncacheable (`no-store`) round trips to the
 * database, and a phone on a slow connection paid for both. Callers now share
 * one in-flight request, and a result younger than FRESH_MS is reused.
 *
 * The window is deliberately short: it only has to cover requests fired by the
 * same page load. Anything that actually changes the cart announces it through
 * notifyCartChanged(), and those refreshes pass `fresh` and skip the cache.
 */

export type CartSummary = { count: number; subtotal: number };

const FRESH_MS = 2000;
const EMPTY: CartSummary = { count: 0, subtotal: 0 };

let inflight: Promise<CartSummary> | null = null;
let last: { at: number; value: CartSummary } | null = null;

export function getCartSummary({ fresh = false } = {}): Promise<CartSummary> {
  if (!fresh) {
    if (inflight) return inflight;
    if (last && Date.now() - last.at < FRESH_MS) {
      return Promise.resolve(last.value);
    }
  }

  const request = fetch("/api/cart/count")
    .then((res) => (res.ok ? res.json() : EMPTY))
    .then((data: Partial<CartSummary>) => {
      const value = { count: data.count ?? 0, subtotal: data.subtotal ?? 0 };
      last = { at: Date.now(), value };
      return value;
    })
    // a failure is not cached, so the next caller tries again
    .catch(() => EMPTY)
    .finally(() => {
      if (inflight === request) inflight = null;
    });

  inflight = request;
  return request;
}
