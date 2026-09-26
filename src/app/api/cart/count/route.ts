import { NextResponse } from "next/server";

import { getCart } from "@/server/queries/cart";

export const dynamic = "force-dynamic";

/**
 * Cart summary for client components. Reading the cart cookie during a page
 * render would make that route dynamic, so the header badge and the product
 * page's delivery bar both hydrate from here instead.
 */
export async function GET() {
  const cart = await getCart();

  // after any combo saving: the free-delivery bar measures what is paid
  return NextResponse.json(
    { count: cart.itemCount, subtotal: cart.subtotal - cart.comboDiscount },
    { headers: { "Cache-Control": "no-store" } },
  );
}
