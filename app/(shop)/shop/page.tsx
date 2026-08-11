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
    <div className="container-page py-12">
      <header>
        <p className="eyebrow">All products</p>
        <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          Shop
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
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
