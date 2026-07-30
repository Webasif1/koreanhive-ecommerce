import type { Metadata } from "next";

import { ProductGrid } from "@/components/product/product-grid";
import { isProductSort, SortLinks } from "@/components/product/sort-links";
import { getProducts } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Shop All Korean Skincare & Beauty",
  description:
    "Browse every Korean beauty and skincare product available at Korean Hive, with cash on delivery across Bangladesh.",
  // ?sort= variants are the same listing; point them all at /shop
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const activeSort = isProductSort(sort) ? sort : "newest";
  const products = await getProducts({ sort: activeSort });

  return (
    <div className="container-page py-10 md:py-14">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Shop
        </h1>
        <p className="text-muted-foreground">
          {products.length} authentic K-beauty{" "}
          {products.length === 1 ? "product" : "products"}, delivered
          nationwide.
        </p>
      </header>

      <div className="mt-6">
        <SortLinks basePath="/shop" active={activeSort} />
      </div>

      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
