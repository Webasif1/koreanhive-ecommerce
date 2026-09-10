import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

/**
 * Product detail fallback.
 *
 * Shaped like the page rather than reusing the listing skeleton: a square
 * where the gallery goes, then the title, price and button column. A fallback
 * whose layout does not match what replaces it makes the page appear to jump
 * when it arrives, which reads as worse than no fallback at all.
 */
export default function ProductLoading() {
  return (
    <div className="container-page py-12">
      <Skeleton className="h-3 w-64" />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square w-full" />

        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-40" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
