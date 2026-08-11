import type { Metadata } from "next";
import Link from "next/link";

import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getWishlist } from "@/server/queries/wishlist";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const items = await getWishlist();
  const savedIds = new Set(items.map((item) => item.id));

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Your wishlist
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 border border-border bg-card p-14 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            Nothing saved yet. Tap the heart on any product to keep it here —
            no account needed.
          </p>
          <Button asChild>
            <Link href="/shop">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid products={items} savedIds={savedIds} />
        </div>
      )}
    </div>
  );
}
