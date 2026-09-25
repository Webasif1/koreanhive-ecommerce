import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/server/queries/catalog";

export function ProductGrid({
  products,
  emptyMessage = "No products here yet.",
  badge,
  priorityCount = 4,
}: {
  products: ProductCardData[];
  emptyMessage?: string;
  /** optional status badge shown on every card in this grid */
  badge?: string;
  /** How many leading cards preload their image. Four is the first row on
   *  desktop, where a listing grid is the top of the page. A grid further
   *  down (home, cart) passes 0: preloading images a phone will not reach
   *  for several screens only competes with the ones it will. */
  priorityCount?: number;
}) {
  if (products.length === 0) {
    return (
      <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
          badge={badge}
        />
      ))}
    </div>
  );
}
