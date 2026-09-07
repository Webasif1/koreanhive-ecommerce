/**
 * A one-line client-side signal that the cart changed.
 *
 * The header badge lives in the layout and cannot see a Server Action running
 * inside a page. It used to refetch only when the pathname changed, so adding
 * from a product page — which does not navigate — left the badge showing the
 * old number until the shopper moved pages. On a shop, the cart count is the
 * running total the customer trusts; a stale one contradicts the toast that
 * just told them the item went in.
 */
export const CART_CHANGED_EVENT = "kh:cart-changed";

export function notifyCartChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}
