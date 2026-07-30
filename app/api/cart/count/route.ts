import { NextResponse } from "next/server";

import { getCartItemCount } from "@/server/queries/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await getCartItemCount();

  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
