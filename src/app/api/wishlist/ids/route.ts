import { NextResponse } from "next/server";

import { getWishlistProductIds } from "@/server/queries/wishlist";

export const dynamic = "force-dynamic";

/**
 * The wishlist is per-guest and therefore cookie-bound. Reading that cookie
 * during a page render would opt the whole route out of static rendering, so
 * the hearts hydrate from here instead — same reasoning as /api/cart/count.
 */
export async function GET() {
  const ids = await getWishlistProductIds();

  return NextResponse.json(
    { ids: [...ids] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
