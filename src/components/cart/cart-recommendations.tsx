import { ProductGrid } from "@/components/product/product-grid";
import { getCartRecommendations } from "@/server/queries/catalog";

/**
 * Suggestions drawn from what is already in the bag.
 *
 * Async and rendered behind Suspense by the cart page: the lines and the total
 * are the point of that page, so they must not wait on this query.
 */
export async function CartRecommendations({
  productIds,
}: {
  productIds: string[];
}) {
  const products = await getCartRecommendations(productIds);

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="eyebrow">Before you check out</p>
      <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Goes well with your bag
      </h2>
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
