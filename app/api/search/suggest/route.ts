import { NextResponse } from "next/server";

import { getSearchSuggestions } from "@/server/queries/catalog";

export const dynamic = "force-dynamic";

/**
 * Typeahead rows for the header search box.
 *
 * Nothing here depends on who is asking, so the response is publicly
 * cacheable — unlike /api/cart/count and /api/wishlist/ids, which are
 * cookie-bound and must stay no-store.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";

  // buildSearchScope treats anything shorter than two characters as "no
  // search", so this never reaches the database
  const products = await getSearchSuggestions(q);

  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
