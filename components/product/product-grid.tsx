import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/server/queries/catalog";

export function ProductGrid({
  products,
  emptyMessage = "No products here yet.",
  savedIds,
  badge,
}: {
  products: ProductCardData[];
  emptyMessage?: string;
  /** product ids already on the guest's wishlist, so hearts render filled */
  savedIds?: Set<string>;
  /** optional status badge shown on every card in this grid */
  badge?: string;
}) {
  if (products.length === 0) {
    return (
      <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < 4}
          saved={savedIds?.has(product.id) ?? false}
          badge={badge}
        />
      ))}
    </div>
  );
}
