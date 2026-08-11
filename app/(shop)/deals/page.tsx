import type { Metadata } from "next";

import { ProductGrid } from "@/components/product/product-grid";
import { getDiscountedProducts } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Hot Deals",
  description:
    "Korean skincare and beauty currently marked down at Korean Hive, with cash on delivery across Bangladesh.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  const products = await getDiscountedProducts();

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Hot deals</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Marked down right now
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "product" : "products"} below
        their usual price.
      </p>

      <div className="mt-8">
        <ProductGrid
          products={products}
         
          emptyMessage="No active discounts today — check back soon."
        />
      </div>
    </div>
  );
}
